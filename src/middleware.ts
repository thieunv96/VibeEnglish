import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Skip Next internals and all static files
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
