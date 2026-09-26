import { useEffect, useRef } from "react";
import { useGoogleOAuth } from "@react-oauth/google";

// Google's script must be initialised only once per page load; after that the button is
// just re-drawn (e.g. when coming back to the login page or when the width changes).
// The callback reads whichever login page is currently mounted through `activeHandlers`.
let initialisedFor = null;
const activeHandlers = { onSuccess: null, onError: null };

export default function GoogleSignInButton({ onSuccess, onError, width }) {
  const containerRef = useRef(null);
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();

  useEffect(() => {
    activeHandlers.onSuccess = onSuccess;
    activeHandlers.onError = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    const gsi = window.google?.accounts?.id;
    if (!scriptLoadedSuccessfully || !gsi || !containerRef.current) return;

    if (initialisedFor !== clientId) {
      gsi.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) activeHandlers.onSuccess?.(response);
          else activeHandlers.onError?.();
        },
      });
      initialisedFor = clientId;
    }

    gsi.renderButton(containerRef.current, {
      type: "standard",
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: String(width),
    });
  }, [clientId, scriptLoadedSuccessfully, width]);

  return <div ref={containerRef} style={{ height: 40 }} />;
}
