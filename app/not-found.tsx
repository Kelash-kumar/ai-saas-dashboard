import Link from 'next/link';
export default function NotFound() {
    return (
        <div className="empty-page">
            <span className="eyebrow">404 · PAGE NOT FOUND</span>
            <h1>A little off the beaten path.</h1>
            <p>This page doesn’t exist. Let’s get you back to your workspace.</p>
            <Link className="btn btn-primary" href="/">
                Back to overview
            </Link>
        </div>
    );
}
