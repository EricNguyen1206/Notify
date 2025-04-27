export async function fetchPoll(pollId: string) {
  const res = await fetch(`https://api.example.com/polls/${pollId}`);
  if (!res.ok) throw new Error("Failed to fetch poll");
  return res.json();
}

export async function votePoll(pollId: string, option: "A" | "B") {
  const res = await fetch(`https://api.example.com/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ option }),
  });
  if (!res.ok) throw new Error("Failed to vote");
  return res.json();
}
