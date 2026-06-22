const DIGILOCKER_AUTH_BASE = "https://api.digitallocker.gov.in/public/oauth2/1/authorize";
const DIGILOCKER_TOKEN_URL = "https://api.digitallocker.gov.in/public/oauth2/1/token";

export function buildDigilockerAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(DIGILOCKER_AUTH_BASE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeDigilockerCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string; digilocker_id?: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
  });

  const res = await fetch(DIGILOCKER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiLocker token exchange failed: ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    digilockerid?: string;
  };

  return {
    access_token: data.access_token,
    digilocker_id: data.digilockerid,
  };
}