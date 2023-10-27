import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export default function ErrorPage() {
    const error = useRouteError();
    if (!isRouteErrorResponse(error)) {
        return null;
    }
    return (
        <div className="ErrorPage">
            <h2>{error.status}</h2>
            <h1>{error.statusText}</h1>
            <pre>{error.data}</pre>
        </div>
    );
};
