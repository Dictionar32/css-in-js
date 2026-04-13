#!/usr/bin/env node
/**
 * Setup GitHub labels dan milestone untuk Sprint 1.
 * Usage: GITHUB_TOKEN=xxx node scripts/setup-github-labels.mjs owner/repo
 *
 * Atau jalankan manual di GitHub UI dengan label di bawah ini.
 */

const LABELS = [
  { name: "status/prototipe", color: "ededed", description: "Prototype stage — not yet buildable" },
  { name: "status/buildable", color: "0075ca", description: "Buildable — CI passing" },
  { name: "status/production", color: "0e8a16", description: "Production-ready — all gates green" },
  { name: "track/A", color: "e4e669", description: "Track A: Prototipe → Buildable" },
  { name: "track/B", color: "f9d0c4", description: "Track B: Buildable → Production-ready" },
  { name: "track/C", color: "c2e0c6", description: "Track C: Production-ready → Released" },
]

const MILESTONE = {
  title: "Sprint 1: Upgrade Status Q2 2025",
  description: "Track A/B/C upgrade sprint — 2 weeks",
  due_on: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
}

const [,, repo] = process.argv
const token = process.env.GITHUB_TOKEN

if (!token || !repo) {
  console.log("Usage: GITHUB_TOKEN=xxx node scripts/setup-github-labels.mjs owner/repo")
  console.log("\nLabels to create manually in GitHub UI:")
  for (const l of LABELS) {
    console.log(`  - ${l.name} (#${l.color}) — ${l.description}`)
  }
  console.log(`\nMilestone: "${MILESTONE.title}"`)
  process.exit(0)
}

const headers = {
  "Authorization": `Bearer ${token}`,
  "Accept": "application/vnd.github+json",
  "Content-Type": "application/json",
}
const base = `https://api.github.com/repos/${repo}`

for (const label of LABELS) {
  const r = await fetch(`${base}/labels`, {
    method: "POST", headers,
    body: JSON.stringify(label),
  })
  console.log(`${r.ok ? "✅" : "❌"} Label: ${label.name} (${r.status})`)
}

const mr = await fetch(`${base}/milestones`, {
  method: "POST", headers,
  body: JSON.stringify(MILESTONE),
})
console.log(`${mr.ok ? "✅" : "❌"} Milestone: ${MILESTONE.title} (${mr.status})`)
