import { CredentialsMethod, OpenFgaClient } from "@openfga/sdk";
import { query } from "./db-postgres";

export type Permission =
  | "pay_bills"
  | "book_appointments"
  | "large_payments"
  | "view_audit_log";

export type Invite = {
  id: string;
  recipientUserId: string;
  caregiverEmail: string;
  caregiverUserId?: string;
  permissions: Permission[];
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  acceptedAt?: string;
};

export type Caregiver = {
  id: string;
  recipientUserId: string;
  caregiverUserId: string;
  caregiverEmail: string;
  caregiverName?: string;
  permissions: Permission[];
  createdAt: string;
};

function getFgaClient(): OpenFgaClient {
  return new OpenFgaClient({
    apiUrl: process.env.FGA_API_URL!,
    storeId: process.env.FGA_STORE_ID!,
    authorizationModelId: process.env.FGA_MODEL_ID!,
    credentials: {
      method: CredentialsMethod.ClientCredentials,
      config: {
        apiTokenIssuer: "auth.fga.dev",
        apiAudience: process.env.FGA_AUDIENCE!,
        clientId: process.env.FGA_CLIENT_ID!,
        clientSecret: process.env.FGA_CLIENT_SECRET!,
      },
    },
  });
}

async function writeFgaTuples(
  caregiverUserId: string,
  permissions: Permission[]
) {
  try {
    const client = getFgaClient();
    const tuples = [];

    if (permissions.includes("pay_bills") || permissions.includes("large_payments")) {
      tuples.push({
        user: `user:${caregiverUserId}`,
        relation: "caregiver",
        object: "bill:electric_march",
      });
    }

    if (permissions.includes("book_appointments")) {
      tuples.push({
        user: `user:${caregiverUserId}`,
        relation: "caregiver",
        object: "appointment:checkup_apr_10",
      });
    }

    if (tuples.length > 0) {
      try {
        await client.write({ writes: tuples });
        console.log("FGA tuples written for caregiver:", caregiverUserId);
      } catch (writeErr: unknown) {
        const msg = writeErr instanceof Error ? writeErr.message : String(writeErr);
        if (msg.includes("already exists")) {
          console.log("FGA tuples already exist, skipping write");
        } else {
          throw writeErr;
        }
      }
    }
  } catch (err) {
    console.error("Failed to write FGA tuples:", err);
  }
}

async function deleteFgaTuples(caregiverUserId: string) {
  try {
    const client = getFgaClient();

    const tuples = [
      {
        user: `user:${caregiverUserId}`,
        relation: "caregiver",
        object: "bill:electric_march",
      },
      {
        user: `user:${caregiverUserId}`,
        relation: "caregiver",
        object: "appointment:checkup_apr_10",
      },
    ];

    try {
      await client.write({ deletes: tuples });
      console.log("FGA tuples deleted for caregiver:", caregiverUserId);
    } catch (deleteErr: unknown) {
      const msg = deleteErr instanceof Error ? deleteErr.message : String(deleteErr);
      if (msg.includes("did not exist")) {
        console.log("FGA tuples already removed, skipping delete");
      } else {
        throw deleteErr;
      }
    }
  } catch (err) {
    console.error("Failed to delete FGA tuples:", err);
  }
}

export async function createInvite(data: {
  recipientUserId: string;
  caregiverEmail: string;
  permissions: Permission[];
}): Promise<Invite> {
  const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await query(
    `INSERT INTO invites (id, recipient_user_id, caregiver_email, permissions, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [id, data.recipientUserId, data.caregiverEmail, JSON.stringify(data.permissions)]
  );
  const res = await query(`SELECT * FROM invites WHERE id = $1`, [id]);
  return mapInvite(res.rows[0]);
}

export async function getInvite(id: string): Promise<Invite | undefined> {
  const res = await query(`SELECT * FROM invites WHERE id = $1`, [id]);
  return res.rows[0] ? mapInvite(res.rows[0]) : undefined;
}

export async function acceptInvite(
  inviteId: string,
  caregiverUserId: string,
  caregiverName: string
): Promise<void> {
  const invite = await getInvite(inviteId);
  if (!invite) throw new Error("Invite not found");
  if (invite.status !== "pending") throw new Error("Invite already used");

  await query(
    `UPDATE invites SET status = 'accepted', caregiver_user_id = $1, accepted_at = NOW()
     WHERE id = $2`,
    [caregiverUserId, inviteId]
  );

  const cgId = `cg_${Date.now()}`;
  await query(
    `INSERT INTO caregivers
       (id, recipient_user_id, caregiver_user_id, caregiver_email, caregiver_name, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (recipient_user_id, caregiver_user_id)
     DO UPDATE SET permissions = EXCLUDED.permissions`,
    [
      cgId,
      invite.recipientUserId,
      caregiverUserId,
      invite.caregiverEmail,
      caregiverName,
      JSON.stringify(invite.permissions),
    ]
  );

  await writeFgaTuples(caregiverUserId, invite.permissions);
}

export async function getCaregiver(
  recipientUserId: string,
  caregiverUserId: string
): Promise<Caregiver | undefined> {
  const res = await query(
    `SELECT * FROM caregivers WHERE recipient_user_id = $1 AND caregiver_user_id = $2`,
    [recipientUserId, caregiverUserId]
  );
  return res.rows[0] ? mapCaregiver(res.rows[0]) : undefined;
}

export async function listCaregivers(recipientUserId: string): Promise<Caregiver[]> {
  const res = await query(
    `SELECT * FROM caregivers WHERE recipient_user_id = $1 ORDER BY created_at DESC`,
    [recipientUserId]
  );
  return res.rows.map(mapCaregiver);
}

export async function listInvites(recipientUserId: string): Promise<Invite[]> {
  const res = await query(
    `SELECT * FROM invites WHERE recipient_user_id = $1 ORDER BY created_at DESC`,
    [recipientUserId]
  );
  return res.rows.map(mapInvite);
}

export async function revokeCaregiver(
  recipientUserId: string,
  caregiverUserId: string
): Promise<void> {
  await query(
    `DELETE FROM caregivers WHERE recipient_user_id = $1 AND caregiver_user_id = $2`,
    [recipientUserId, caregiverUserId]
  );
  await deleteFgaTuples(caregiverUserId);
}

function mapInvite(row: Record<string, unknown>): Invite {
  return {
    id: row.id as string,
    recipientUserId: row.recipient_user_id as string,
    caregiverEmail: row.caregiver_email as string,
    caregiverUserId: row.caregiver_user_id as string | undefined,
    permissions: (row.permissions as Permission[]) ?? [],
    status: row.status as Invite["status"],
    createdAt: String(row.created_at),
    acceptedAt: row.accepted_at ? String(row.accepted_at) : undefined,
  };
}

function mapCaregiver(row: Record<string, unknown>): Caregiver {
  return {
    id: row.id as string,
    recipientUserId: row.recipient_user_id as string,
    caregiverUserId: row.caregiver_user_id as string,
    caregiverEmail: row.caregiver_email as string,
    caregiverName: row.caregiver_name as string | undefined,
    permissions: (row.permissions as Permission[]) ?? [],
    createdAt: String(row.created_at),
  };
}