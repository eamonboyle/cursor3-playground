import type { Contact } from "./types"

export function defaultContacts(): Contact[] {
  return [
    {
      id: "c1",
      name: "Alex Rivera",
      email: "alex@example.com",
      company: "Northwind",
      tags: ["design", "priority"],
      notes: "Met at the meetup; prefers email over Slack.",
    },
    {
      id: "c2",
      name: "Jordan Lee",
      email: "jordan@example.com",
      company: "Contoso",
      tags: ["engineering"],
      notes: "",
    },
    {
      id: "c3",
      name: "Sam Patel",
      email: "sam@example.com",
      company: "Fabrikam",
      tags: ["sales", "priority"],
      notes: "Follow up Q2.",
    },
  ]
}
