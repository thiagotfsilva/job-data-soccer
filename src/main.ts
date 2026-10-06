import client from "./ClientHttp";

client
  .get<unknown>("/competitions/BSA/matches")
  .then((data) => {
    console.log();
  })
  .catch((error) => {
    console.error("Error fetching competitions:", error);
  });
