'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <div className="empty-page">
            <h1>Something didn’t load.</h1>
            <p>Please try again. Your theme preferences are safe.</p>
            <button type="button" className="btn btn-primary" onClick={reset}>
                Try again
            </button>
        </div>
    );
}
