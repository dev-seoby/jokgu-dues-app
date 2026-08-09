import { supabase } from "./supabaseClient";
import type { Member, Transaction } from "../data/mock";

/**
 * Supabase members / transactions 테이블 CRUD + snake_case <-> camelCase 매핑
 *
 * DB 컬럼은 payment_type / paid_months / receipt_image_url 처럼 snake_case인 반면
 * 앱 내부 타입(Member/Transaction)은 카멜케이스라 이 파일에서 변환을 전담함.
 */

interface MemberRow {
  id: string;
  name: string;
  status: string;
  payment_type: string;
  paid_months: number[];
}

interface TransactionRow {
  id: string;
  type: string;
  category: string;
  amount: number;
  memo: string;
  date: string;
  receipt_image_url: string | null;
}

const toMember = (row: MemberRow): Member => ({
  id: row.id,
  name: row.name,
  status: row.status as Member["status"],
  paymentType: row.payment_type as Member["paymentType"],
  paidMonths: row.paid_months ?? [],
});

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  type: row.type as Transaction["type"],
  category: row.category,
  amount: row.amount,
  memo: row.memo,
  date: row.date,
  receiptImageUrl: row.receipt_image_url ?? undefined,
});

export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as MemberRow[]).map(toMember);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as TransactionRow[]).map(toTransaction);
}

export async function insertMember(name: string): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert({ name, status: "active", payment_type: "monthly", paid_months: [] })
    .select()
    .single();
  if (error) throw error;
  return toMember(data as MemberRow);
}

export async function updateMember(
  id: string,
  patch: Partial<{ status: Member["status"]; paymentType: Member["paymentType"]; paidMonths: number[] }>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.paymentType !== undefined) dbPatch.payment_type = patch.paymentType;
  if (patch.paidMonths !== undefined) dbPatch.paid_months = patch.paidMonths;
  const { error } = await supabase.from("members").update(dbPatch).eq("id", id);
  if (error) throw error;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

export async function insertTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      memo: tx.memo,
      date: tx.date,
      receipt_image_url: tx.receiptImageUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toTransaction(data as TransactionRow);
}

export async function insertTransactions(txs: Omit<Transaction, "id">[]): Promise<Transaction[]> {
  if (txs.length === 0) return [];
  const { data, error } = await supabase
    .from("transactions")
    .insert(
      txs.map((tx) => ({
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        memo: tx.memo,
        date: tx.date,
        receipt_image_url: tx.receiptImageUrl ?? null,
      })),
    )
    .select();
  if (error) throw error;
  return (data as TransactionRow[]).map(toTransaction);
}
