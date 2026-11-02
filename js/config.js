/* Single source for external URLs and release fallbacks.
   Discord: https://dsc.gg/kwanteks
   Other invites still exist off-site (e.g. discord.gg/rpKVgutq6F on README badge).
   Change discord here only; keep HTML hrefs in sync. */
window.SITE = {
  org: 'Synergy-Tweaks',
  orgUrl: 'https://github.com/Synergy-Tweaks',
  discord: 'https://dsc.gg/kwanteks',
  youtube: 'https://www.youtube.com/@kwanteks',
  twitter: 'https://x.com/synergyos48',
  ameWizard: 'https://download.ameliorated.io/AME%20Beta.zip',
  windows11: 'https://www.microsoft.com/software-download/windows11',
  /* TODO: set production origin for canonical / OG / sitemap */
  origin: '',
  repos: {
    SynergyOS: {
      url: 'https://github.com/Synergy-Tweaks/SynergyOS',
      releases: 'https://github.com/Synergy-Tweaks/SynergyOS/releases',
      latest: 'https://github.com/Synergy-Tweaks/SynergyOS/releases/latest',
      ext: '.apbx',
      /* Asset name is resolved from the API; fallback is the release page */
      asset: '',
      fallback: 'https://github.com/Synergy-Tweaks/SynergyOS/releases/latest',
    },
    SynToolkit: {
      url: 'https://github.com/Synergy-Tweaks/SynToolkit',
      releases: 'https://github.com/Synergy-Tweaks/SynToolkit/releases',
      latest: 'https://github.com/Synergy-Tweaks/SynToolkit/releases/latest',
      ext: '.exe',
      /* Filename changes per release; filled from API into /releases/latest/download/NAME */
      asset: '',
      fallback: 'https://github.com/Synergy-Tweaks/SynToolkit/releases/latest',
    },
    OriginalPostInstall: {
      url: 'https://github.com/Synergy-Tweaks/Original-Post-Install',
    },
  },
  /* Compatibility as documented on the SynergyOS README. */
  compatibility: 'Windows 10 22H2 and Windows 11 22H2–26H2 (LTSC included; 26H2 experimental)',
  team: {
    leads: [
      { name: 'Kwanteks', role: 'Owner & Developer', github: 'https://github.com/kwanteks', avatar: 'images/profiles/Kwanteks.png' },
      { name: 'Bry1k', role: 'Owner & Developer', github: 'https://github.com/bry1k', avatar: 'images/profiles/Bry1k.webp' },
    ],
    contributors: {
      SynergyOS: {
        graph: 'https://contrib.rocks/image?repo=Synergy-Tweaks/SynergyOS',
        url: 'https://github.com/Synergy-Tweaks/SynergyOS/graphs/contributors',
      },
      SynToolkit: {
        graph: 'https://contrib.rocks/image?repo=Synergy-Tweaks/SynToolkit',
        url: 'https://github.com/Synergy-Tweaks/SynToolkit/graphs/contributors',
      },
    },
  },
};
