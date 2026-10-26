export async function runBulkTrashAction(records, action) {
  const results = await Promise.allSettled(records.map((record) => action(record.id)));

  return {
    succeeded: records.filter((_, index) => results[index].status === "fulfilled"),
    failed: records.filter((_, index) => results[index].status === "rejected"),
  };
}
