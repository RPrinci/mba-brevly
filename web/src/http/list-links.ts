import axios from "axios";

export async function listLinks() {
  const data = {
    sortBy: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 100000,
  };
  try {
    const response = await axios.post(
      "http://localhost:3333/shortened-links",
      data
    );
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
}
