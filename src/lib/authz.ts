import { checkPermission } from "@/lib/fga";

export async function canPayBill(args: {
  caregiverUserId: string;
  billId: string;
}) {
  return checkPermission({
    user: `user:${args.caregiverUserId}`,
    relation: "can_pay",
    object: `bill:${args.billId}`,
  });
}

export async function canBookAppointment(args: {
  caregiverUserId: string;
  appointmentId: string;
}) {
  return checkPermission({
    user: `user:${args.caregiverUserId}`,
    relation: "can_book",
    object: `appointment:${args.appointmentId}`,
  });
}

export async function canApproveRequest(args: {
  approverUserId: string;
  approvalId: string;
}) {
  return checkPermission({
    user: `user:${args.approverUserId}`,
    relation: "can_approve",
    object: `approval_request:${args.approvalId}`,
  });
}