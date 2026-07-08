import { getRequestConfig } from "next-intl/server";

// Single-locale (Russian-only) setup — no i18n routing, no middleware.
// next-intl is used purely as a message catalogue for the RU interface.
export default getRequestConfig(async () => {
  const locale = "ru";

  return {
    locale,
    messages: (await import("../../messages/ru.json")).default,
  };
});
