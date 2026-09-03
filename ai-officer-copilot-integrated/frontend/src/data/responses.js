/* ==========================================================
   Mock AI response library.
   Swap `getAIResponse` for a real API call to make this live —
   see the "Connecting a real backend" section in README.md.
   ========================================================== */

export const RESPONSES = {
  letter: `
    <p>Here is a draft letter. It follows a standard professional format — please review before sending.</p>
    <p class="mono-block">To,
The Hiring Manager
Acme Corporation

Subject: Follow-up on Application — Marketing Coordinator Role

Dear Hiring Manager,

I'm writing to follow up on my application for the Marketing Coordinator position submitted last week. I remain very interested in the role and wanted to check on the status of my application, and share that I'm happy to provide any additional information that would be helpful.

Thank you for your time and consideration.

Best regards,
Jane Smith</p>
    <p>I can adjust the tone, add specific details, or generate this as a downloadable Word document — just let me know.</p>
  `,

  summary: `
    <p>I've read through the 40-page market research report. Here's the condensed summary:</p>
    <ul>
      <li><strong>Scope:</strong> Analyzes consumer demand across 6 regional markets for the new product line.</li>
      <li><strong>Budget impact:</strong> Recommends an initial $180K marketing spend, phased over 2 quarters.</li>
      <li><strong>Key risk flagged:</strong> Section 4 notes supply chain delays in 2 regions could push launch by 6–8 weeks.</li>
      <li><strong>Recommendation:</strong> Report suggests a staged rollout, starting in the two highest-demand regions.</li>
    </ul>
    <p>Want the full section-by-section breakdown, or just the risk section expanded?</p>
  `,

  pending: `
    <p>Here are the open action items pulled from last week's notes and meetings:</p>
    <div class="case-card">
      <div class="case-card-head">3 pending actions found</div>
      <div class="case-card-body">
        <div class="case-row"><div class="k">Action</div><div>Finalize vendor contract — office relocation</div></div>
        <div class="case-row"><div class="k">Owner</div><div>Operations Team</div></div>
        <div class="case-row"><div class="k">Deadline</div><div>30 Aug 2026</div></div>
        <div class="case-row"><div class="k">Status</div><div><span class="badge pending">● Pending</span></div></div>
      </div>
    </div>
    <div class="case-card">
      <div class="case-card-head">Design review — landing page mockups</div>
      <div class="case-card-body">
        <div class="case-row"><div class="k">Owner</div><div>Design Team</div></div>
        <div class="case-row"><div class="k">Deadline</div><div>22 Aug 2026</div></div>
        <div class="case-row"><div class="k">Status</div><div><span class="badge done">● Completed</span></div></div>
      </div>
    </div>
  `,

  search: `
    <p>I searched previous notes and shared files related to this topic:</p>
    <ul>
      <li><strong>Doc #0287 (Mar 2025):</strong> A similar issue was resolved by adjusting the pricing tier — useful precedent.</li>
      <li><strong>Team wiki:</strong> Guideline on the standard approval process for this type of request.</li>
      <li><strong>Doc #0193 (Nov 2023):</strong> Earlier project referencing the same policy clause.</li>
    </ul>
    <p>I can pull the full text of any of these, or draft a note referencing the Doc #0287 precedent.</p>
  `,

  minutes: `
    <p>I've processed the uploaded recording of the <strong>Project Review Meeting</strong> and generated structured minutes:</p>
    <div class="case-card">
      <div class="case-card-head">Meeting: Project Review Meeting <span class="mono-inline">06 Aug 2026</span></div>
      <div class="case-card-body">
        <div class="case-row"><div class="k">Decision</div><div>Finalize the Q3 marketing budget proposal.</div></div>
        <div class="case-row"><div class="k">Responsible</div><div>Marketing Team</div></div>
        <div class="case-row"><div class="k">Deadline</div><div>30 Aug 2026</div></div>
        <div class="case-row"><div class="k">Status</div><div><span class="badge pending">● Pending</span></div></div>
      </div>
    </div>
    <div class="case-card">
      <div class="case-card-head">Decision 2 — Budget sign-off</div>
      <div class="case-card-body">
        <div class="case-row"><div class="k">Responsible</div><div>Finance Team</div></div>
        <div class="case-row"><div class="k">Deadline</div><div>15 Aug 2026</div></div>
        <div class="case-row"><div class="k">Status</div><div><span class="badge pending">● Pending</span></div></div>
      </div>
    </div>
    <p>Full transcript and speaker-wise notes are saved to File #0417. Shall I add these action items to the pending tracker?</p>
  `,

  fallback: `
    <p>Noted. I'll work from your uploaded files and past conversations to put this together. In this prototype I have canned answers for drafting letters, summarizing reports, generating meeting minutes, tracking pending actions, and searching past notes — try one of the quick actions on the left, or a suggestion chip below the message box. Connect a real backend for open-ended answers on any topic.</p>
  `
}

export function classifyPrompt(text) {
  const t = text.toLowerCase()
  if (t.includes('letter') || t.includes('clearance') || t.includes('cover letter')) return 'letter'
  if (t.includes('summar')) return 'summary'
  if (t.includes('pending') || t.includes('action')) return 'pending'
  if (t.includes('decision') || t.includes('search') || t.includes('policy') || t.includes('precedent')) return 'search'
  if (t.includes('minute') || t.includes('meeting') || t.includes('recording')) return 'minutes'
  return 'fallback'
}

export function getAIResponse(userText, forcedKey) {
  const key = forcedKey || classifyPrompt(userText)
  return RESPONSES[key] || RESPONSES.fallback
}
