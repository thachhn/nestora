const API_BASE_URL =
  "https://asia-southeast1-nestora-register.cloudfunctions.net";

export const requestDownload = async (email: string, productId: string) => {
  const response = await fetch(`${API_BASE_URL}/requestDownload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      productId,
    }),
  });

  return response;
};

export const confirmDownload = async (
  email: string,
  otp: string,
  productId: string
) => {
  const response = await fetch(`${API_BASE_URL}/confirmDownload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp, productId }),
  });

  return response;
};

export const addUsersToProduct = async (
  emails: string[],
  productId: string,
  apiKey: string
) => {
  const response = await fetch(`${API_BASE_URL}/addUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ emails, productId }),
  });
  return response;
};
