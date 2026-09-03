/** Safe rendering for people.html. */
(function() {
  'use strict';

  const html = window.escapeHtml;
  const href = value => html(window.safeHref(value));

  function renderMemberCard(member) {
    const skills = (member.skills || []).map(skill => `<span class="skill-tag">${html(skill)}</span>`).join('');
    const awards = member.awards
      ? `<p style="font-size:0.7rem;color:var(--accent-secondary);margin-top:0.3em">${member.awards.map(html).join(' · ')}</p>`
      : '';
    const bio = member.bio ? `<p class="member-bio">${html(member.bio)}</p>` : '';
    const role = member.roleNow
      ? '<span class="role-former">' + html(member.role) + '</span> <span class="role-arrow" aria-hidden="true">&rarr;</span> ' + html(member.roleNow)
      : html(member.role);
    return `
      <div class="member-card">
        <div class="avatar">${member.photo ? `<img src="${href(member.photo)}" alt="${html(member.name)}">` : html(member.initials)}</div>
        <div>
          <h4>${html(member.name)}${member.credentials ? ', ' + html(member.credentials) : ''}</h4>
          <p class="role">${role}${member.funding ? ' · ' + html(member.funding) : ''}</p>
          <p class="focus">${html(member.focus)}</p>
          ${awards}
          ${bio}
          <div class="skills">${skills}</div>
        </div>
      </div>`;
  }

  document.getElementById('pi-bio').textContent = LAB_DATA.pi.bio || LAB_DATA.pi.identity;
  document.getElementById('pi-links').innerHTML = Object.entries(LAB_DATA.pi.links).map(([name, url]) =>
    '<a href="' + href(url) + '" target="_blank" rel="noopener" class="btn btn-sm btn-ghost">' +
      html(name.charAt(0).toUpperCase() + name.slice(1)) + '</a>'
  ).join('');

  document.getElementById('senior-grid').innerHTML = LAB_DATA.team.senior.map(renderMemberCard).join('');
  document.getElementById('grad-grid').innerHTML = LAB_DATA.team.graduate.map(renderMemberCard).join('');
  document.getElementById('staff-grid').innerHTML = LAB_DATA.team.specialist.map(renderMemberCard).join('');

  function renderAdminCard(member) {
    const contact = [
      member.email ? '<a href="' + href('mailto:' + member.email) + '">' + html(member.email) + '</a>' : '',
      html(member.phone || ''),
      member.profileUrl ? '<a href="' + href(member.profileUrl) + '" target="_blank" rel="noopener">Department profile</a>' : ''
    ].filter(Boolean).join(' · ');
    return `
      <div class="member-card">
        <div class="avatar">${member.photo ? `<img src="${href(member.photo)}" alt="${html(member.name)}">` : html(member.initials)}</div>
        <div>
          <h4>${html(member.name)}${member.credentials ? ', ' + html(member.credentials) : ''}</h4>
          <p class="role">${html(member.role)}</p>
          <p class="focus">${html(member.focus || '')}</p>
          ${contact ? '<p class="focus">' + contact + '</p>' : ''}
          ${member.bio ? '<p class="member-bio">' + html(member.bio) + '</p>' : ''}
        </div>
      </div>`;
  }

  const adminGrid = document.getElementById('admin-grid');
  if (adminGrid) adminGrid.innerHTML = (LAB_DATA.team.administration || []).map(renderAdminCard).join('');

  const joinContact = LAB_DATA.lab.contact;
  if (joinContact) {
    document.getElementById('join-contact').textContent = joinContact.note || '';
    document.getElementById('join-actions').innerHTML =
      (joinContact.email ? '<a href="' + href('mailto:' + joinContact.email) + '" class="btn btn-primary">Email ' + html(joinContact.name) + '</a>' : '') +
      (joinContact.profileUrl ? '<a href="' + href(joinContact.profileUrl) + '" class="btn btn-ghost" target="_blank" rel="noopener">Department Profile</a>' : '');
  }

  document.getElementById('undergrad-grid').innerHTML = LAB_DATA.team.undergraduate.map(member => `
    <div class="undergrad-card${member.bio ? ' has-bio' : ''}">
      <div class="avatar">${html(member.initials)}</div>
      <h4>${html(member.name)}${member.role ? ' <span style="font-weight:400;font-size:0.75em;color:var(--text-muted)">' + html(member.role) + '</span>' : ''}</h4>
      <p>${html(member.project)}${member.award ? ' · ' + html(member.award) : ''}</p>
      ${member.bio ? '<p class="undergrad-bio">' + html(member.bio) + '</p>' : ''}
    </div>
  `).join('');

  document.getElementById('collab-grid').innerHTML = LAB_DATA.collaborators.map(collaborator => `
    <div class="collab-card" data-theme="${html(collaborator.theme)}">
      <div>
        <h4>${html(collaborator.name)}</h4>
        <p class="affiliation">${html(collaborator.affiliation)}</p>
        <p class="area">${html(collaborator.area)}</p>
      </div>
    </div>
  `).join('');

  const alumniGrid = document.getElementById('alumni-grid');
  if (alumniGrid && LAB_DATA.alumni.length > 0) {
    alumniGrid.innerHTML = LAB_DATA.alumni.map(member => `
      <div class="member-card">
        <div class="avatar">${member.photo ? `<img src="${href(member.photo)}" alt="${html(member.name)}">` : html(member.initials)}</div>
        <div>
          <h4>${html(member.name)}${member.credentials ? ', ' + html(member.credentials) : ''}</h4>
          <p class="role">${html(member.formerRole)} · ${html(member.period)}</p>
          <p class="focus">${html(member.focus)}</p>
          ${member.awards ? '<p style="font-size:0.7rem;color:var(--accent-secondary);margin-top:0.3em">' + member.awards.map(html).join(' · ') + '</p>' : ''}
          ${member.currentPosition ? '<p style="font-size:var(--text-sm);color:var(--accent-secondary);margin-top:0.3em">Now: ' + html(member.currentPosition) + '</p>' : ''}
          ${member.bio ? '<p class="member-bio">' + html(member.bio) + '</p>' : ''}
        </div>
      </div>
    `).join('');
  }
})();
