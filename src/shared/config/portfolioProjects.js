function driveFileUrl(id) {
  return `https://drive.google.com/file/d/${id}/view?usp=drive_link`
}

export const portfolioProjects = Object.freeze({
  planetA: {
    title: 'FinTech Planet',
    subtitle: 'Lending, banking integrations, and regulated financial software',
    projects: [
      {
        title: 'Peach Finance',
        description:
          'API-first loan management and servicing tech — post-origination platform for launching and running lending programs across asset classes, with configurable loan cores, servicing suites, compliance monitoring, and modern REST APIs.',
        videoUrl: 'https://www.youtube.com/watch?v=rfT8Jhws0WU',
        linkUrl: 'https://www.peachfinance.com/',
        linkLabel: 'peachfinance.com',
      },
    ],
  },
  planetC: {
    title: 'Playable Ads Planet',
    subtitle: 'Interactive ad formats, playable prototypes, and polished micro-experiences',
    projects: [
      {
        title: 'Solitaire',
        description: 'Created completely by myself in a few days, using PixiJS + GSAP.',
        videoUrl: 'https://drive.google.com/file/d/1yLg7N-X9L4calIv0_bmpR3L--IywOQsP/view?usp=drive_link',
      },
      {
        title: 'Gin Rummy',
        description: 'Also written completely by myself, including all game logic, in 1 month, with only assets and references.',
        videoUrl: 'https://drive.google.com/file/d/1dvDxdfeoZqbtw8Mmy7WMzw9DjhWJ6kAs/view?usp=drive_link',
      },
      {
        title: 'Puzzle Game for Burny Games',
        description: 'Playable ad prototype for Burny Games: built in a few days with PixiJS + GSAP, including game flow and polish.',
        videoUrl: 'https://drive.google.com/file/d/1Sr4meGMFPxfUSXsvx8MKVcN3FgvPjNnD/view?usp=drive_link',
      },
    ],
  },
  planetD: {
    title: 'SaaS Planet',
    subtitle: 'Cloud products, subscriptions, and scalable web platforms',
    projects: [
      {
        title: 'Lingio',
        description:
          'Enterprise language-learning SaaS for working professionals: I shipped major parts on SvelteKit with voice recognition for faster speaking practice, role- and industry-specific flows, and gamified lessons aimed at real workplaces.',
        videoUrl: 'https://youtu.be/-vzhZOOu1Xw',
      },
      {
        title: 'William Hill Casino',
        description:
          'Work on a flagship regulated gambling product: sportsbook, casino, and live experiences for one of the UK’s best-known brands, with emphasis on performance, trust, and a huge catalogue of markets and games.',
        videoUrl: 'https://www.youtube.com/watch?v=YTEwIgTyDJ8',
        linkUrl: 'https://www.williamhill.com/',
        linkLabel: 'williamhill.com',
      },
      {
        title: 'Mr Green',
        description:
          'Contributions to a premium online casino brand known for polished UX, a broad slots and live-dealer offering, and strong responsible-gambling tooling across web and app surfaces.',
        videoUrl: 'https://www.youtube.com/watch?v=vY-9pbLzCzE',
        linkUrl: 'https://www.mrgreen.com/',
        linkLabel: 'mrgreen.com',
      },
      {
        title: 'MamaMia Bingo Casino',
        description:
          'Bingo- and casino-focused product in the Nordic space; showcase video with an independent AskGamblers review for context on features, licensing, and player experience.',
        videoUrl: 'https://www.youtube.com/watch?v=COOIWnJuskU',
        linkUrl: 'https://www.askgamblers.com/online-casinos/reviews/mamamia-bingo-casino',
        linkLabel: 'AskGamblers review',
      },
      {
        title: 'Keydrop',
        description:
          'One of the world’s largest CS2 skin-trading and case-opening platforms — high-volume marketplace UX, drops and cases, and real-time inventory and trading flows for a global player base.',
        videoUrl: 'https://www.youtube.com/watch?v=U69VdMqP1OU',
        linkUrl: 'https://www.keydrop.com/',
        linkLabel: 'keydrop.com',
      },
    ],
  },
  planetE: {
    title: 'AR / VR',
    subtitle: 'Instagram Spark AR masks - Drive-hosted preview video plus two to four stills per mask.',
    projects: [
      {
        title: 'AR-mask Khinkali',
        description: 'Food-themed face filter. Main preview and stills load from Google Drive (no local copies).',
        videoSourceSize: { w: 464, h: 664 },
        videoUrl: driveFileUrl('1lPl1H2xN0iqfIapCitP9Qwf72qW4YItJ'),
        screenshots: [driveFileUrl('17KrnE0IUt5S4C2MBg96GFSwlWnE-6ZDY'), driveFileUrl('14lrupev7ct8RaDbU7eCcx92Q4ZhSZ9LC')],
      },
      {
        title: 'AR-mask Aliens Are Ghosts',
        description: 'Alien / ghost world effect. Drive preview plus four thumbnails in the strip.',
        videoSourceSize: { w: 464, h: 664 },
        videoUrl: driveFileUrl('1LSpk6O6K8gFGbq77EHuI7BIn-fFtulP1'),
        screenshots: [
          driveFileUrl('1ZfkHltfNMrIgrAQWIYQprnjyq54DSpP4'),
          driveFileUrl('1XV_-LpQbT-6iTQzcLUu4_gWuv_1j-6lt'),
          driveFileUrl('1bypzQE2WSZQkoKaM7ObSLD_DzvRe5xg1'),
          driveFileUrl('1ZDxscXPlNiPr5-ceA3rxC4IWZgY1dcHn'),
        ],
      },
    ],
  },
  planetB: {
    title: 'Game Planet: My PixiJS Games',
    subtitle: 'Built solo, from gameplay systems to polish',
    carousel: true,
    projects: [
      {
        title: 'Game prototype (placeholder)',
        description: 'A sample game slot for showcasing your next gameplay prototype and iteration timeline.',
        videoUrl: 'https://www.youtube.com/watch?v=dtBFdLOv-XI',
      },
      {
        title: 'Fart Jump Space',
        description: 'Gameplay capture hosted on Google Drive.',
        videoUrl: 'https://drive.google.com/file/d/1MuqQTsT4bpZVvkrw4VCIrpI1U6rxYaIw/view?usp=drive_link',
      },
      {
        title: 'Systems experiment',
        description: 'Pots-O-Loot trailer and game page.',
        videoUrl: 'https://youtu.be/tlHt0p-hdms?si=U1Thz7_gDYQhDOvG',
        linkUrl: 'https://pearfiction.com/games/pots-o-loot/',
        linkLabel: 'Game details',
      },
      {
        title: '4 Spicy Frenzy',
        description: '4 Spicy Frenzy trailer and game page.',
        videoUrl: 'https://www.youtube.com/watch?v=rtFKCbsXxrU',
        linkUrl: 'https://pearfiction.com/games/4-spicy-frenzy/',
        linkLabel: 'Game details',
      },
      {
        title: 'Squealin Riches 2',
        description: 'Squealin Riches 2 trailer and game page.',
        videoUrl: 'https://www.youtube.com/watch?v=3d1btqurdH8',
        linkUrl: 'https://pearfiction.com/games/squealin-riches-2/',
        linkLabel: 'Game details',
      },
      {
        title: 'Bunny Loot',
        description: 'Bunny Loot trailer and game page.',
        videoUrl: 'https://youtu.be/Uu620kJ-l9o?si=t2dkbcr4qNSDm11l',
        linkUrl: 'https://pearfiction.com/games/bunny-loot/',
        linkLabel: 'Game details',
      },
      {
        title: 'Wild Lava',
        description: 'Wild Lava trailer and game page.',
        videoUrl: 'https://www.youtube.com/watch?v=YDPTVYz6uhA',
        linkUrl: 'https://slot.day/playtech/wild-lava/',
        linkLabel: 'Game details',
      },
      {
        title: 'Egypt Slot Game',
        description: 'Gameplay capture hosted on Google Drive.',
        videoUrl: 'https://drive.google.com/file/d/1GOokwaC4xvZ3EqZOJwhcAnTrZG0R2M5u/view?usp=drive_link',
      },
    ],
  },
})
