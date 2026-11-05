const labels = { pending: 'Chờ xử lý', processing: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' };

export default function OrderHistory({ history = [] }) {
  return <div><h3 className="font-semibold">Lịch sử trạng thái</h3>{history.length ? <ol className="mt-3 space-y-2">{history.map((entry) => <li className="text-sm text-slate-600" key={entry.id}><span className="font-medium text-slate-800">{labels[entry.to_status] ?? entry.to_status}</span> · {entry.created_at ? new Date(entry.created_at).toLocaleString('vi-VN') : 'Chưa rõ thời gian'}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Chưa có lịch sử cho đơn cũ.</p>}</div>;
}
