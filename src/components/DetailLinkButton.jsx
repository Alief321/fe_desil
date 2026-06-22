import { Link } from 'react-router-dom';

export default function DetailLinkButton({ section, id, children }) {
  return (
    <Link to={`/detail/${section}/${id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
      {children}
    </Link>
  );
}
