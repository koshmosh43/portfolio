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
        portfolioPreviewBrand: 'Peach Finance',
      },
    ],
  },
  planetC: {
    title: 'Playable Ads Planet',
    subtitle: 'PixiJS · GSAP · WebGL · Basisu',
    mediaScale: 'large',
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
    subtitle: 'iGaming, EdTech & eSports platforms',
    carousel: true,
    projects: [
      {
        title: 'ESports: Keydrop',
        description:
          'One of the world’s largest CS2 skin-trading and case-opening platforms — high-volume marketplace UX, drops and cases, and real-time inventory and trading flows for a global player base.',
        videoUrl: 'https://www.youtube.com/watch?v=U69VdMqP1OU',
        linkUrl: 'https://www.keydrop.com/',
        linkLabel: 'keydrop.com',
        portfolioPreviewBrand: 'Keydrop',
      },
      {
        title: 'ESports: GetInPro',
        description: 'Esports platform for competitive play, tournaments, and player experience — web product in the gaming scene.',
        videoUrl: 'https://www.youtube.com/watch?v=CS4fQ7l22Q0',
        portfolioPreviewBrand: 'GetInPro',
      },
      {
        title: 'Lingio - language-learning app',
        description:
          'Enterprise language-learning SaaS for working professionals: I shipped major parts on SvelteKit with voice recognition for faster speaking practice, role- and industry-specific flows, and gamified lessons aimed at real workplaces.',
        videoUrl: 'https://youtu.be/-vzhZOOu1Xw',
        portfolioPreviewBrand: 'Lingio',
      },
      {
        title: 'William Hill Casino',
        description:
          'Work on a flagship regulated gambling product: sportsbook, casino, and live experiences for one of the UK’s best-known brands, with emphasis on performance, trust, and a huge catalogue of markets and games.',
        videoUrl: 'https://www.youtube.com/watch?v=YTEwIgTyDJ8',
        linkUrl: 'https://www.williamhill.com/',
        linkLabel: 'williamhill.com',
        portfolioPreviewSrc: 'https://i.ytimg.com/vi/YTEwIgTyDJ8/hqdefault.jpg',
        portfolioPreviewBrand: 'William Hill',
      },
      {
        title: 'Mr Green',
        description:
          'Contributions to a premium online casino brand known for polished UX, a broad slots and live-dealer offering, and strong responsible-gambling tooling across web and app surfaces.',
        videoUrl: 'https://www.youtube.com/watch?v=vY-9pbLzCzE',
        linkUrl: 'https://www.mrgreen.com/',
        linkLabel: 'mrgreen.com',
        portfolioPreviewBrand: 'Mr Green',
      },
      {
        title: 'MamaMia Bingo Casino',
        description:
          'Bingo- and casino-focused product in the Nordic space; showcase video with an independent AskGamblers review for context on features, licensing, and player experience.',
        videoUrl: 'https://www.youtube.com/watch?v=COOIWnJuskU',
        linkUrl: 'https://www.askgamblers.com/online-casinos/reviews/mamamia-bingo-casino',
        linkLabel: 'AskGamblers review',
        portfolioPreviewBrand: 'MamaMia Bingo',
      },
    ],
  },
  planetE: {
    title: 'AR / VR',
    subtitle: 'Spark AR masks and immersive experiences for social media platforms',
    mediaScale: 'large',
    projects: [
      {
        title: 'AR-mask "Khinkali"',
        videoSourceSize: { w: 9, h: 16 },
        videoUrl: 'https://www.youtube.com/shorts/OYoY-btHBds',
        screenshots: [driveFileUrl('17KrnE0IUt5S4C2MBg96GFSwlWnE-6ZDY'), driveFileUrl('14lrupev7ct8RaDbU7eCcx92Q4ZhSZ9LC')],
      },
      {
        title: 'AR-mask "Aliens Are Ghosts"',
        videoSourceSize: { w: 9, h: 16 },
        videoUrl: 'https://www.youtube.com/shorts/pNDBIsVjocY',
        screenshots: [
          driveFileUrl('1ZfkHltfNMrIgrAQWIYQprnjyq54DSpP4'),
          driveFileUrl('1XV_-LpQbT-6iTQzcLUu4_gWuv_1j-6lt'),
          driveFileUrl('1bypzQE2WSZQkoKaM7ObSLD_DzvRe5xg1'),
        ],
      },
    ],
  },
  planetB: {
    title: 'Game Planet',
    subtitle: 'React · PixiJS · GSAP · WebGL · ThreeJS · GSAP',
    carousel: true,
    projects: [
      {
        title: 'Trevor Hunter',
        description: 'Enter Trevor Hunter, a fearless tomb-raiding sharpei on a quest for glory, bones, and riches beyond imagination!',
        videoUrl: 'https://www.youtube.com/watch?v=dtBFdLOv-XI',
        linkUrl: 'https://room8studio.com/',
        linkLabel: 'Room 8 Studio',
        portfolioPreviewBrand: 'Room 8 Studio | Zerplaay',
      },
      {
        title: 'Fart Jump Space',
        description: 'PixiJS micro-game — shipped with Room 8 · Zeerpay: tight loops, playful juice, and a tiny astronaut who really should not have eaten that.',
        videoUrl: 'https://drive.google.com/file/d/1MuqQTsT4bpZVvkrw4VCIrpI1U6rxYaIw/view?usp=drive_link',
        linkUrl: 'https://room8studio.com/',
        linkLabel: 'Room 8 Studio',
        portfolioPreviewBrand: 'Room 8 Studio | Zerplaay',
      },
      {
        title: 'Pots-o-Loot',
        description: 'Pots-O-Loot takes the classic leprechaun slot and spikes its Guinness with rainbow-fuelled madness. It’s wild. It’s witty. It’s wickedly chaotic.',
        videoUrl: 'https://youtu.be/tlHt0p-hdms?si=U1Thz7_gDYQhDOvG',
        linkUrl: 'https://pearfiction.com/games/pots-o-loot/',
        linkLabel: 'Game details',
        portfolioPreviewSrc: 'https://pearfiction.com/wp-content/uploads/2025/10/00198_pots_o_loot.png',
        portfolioPreviewBrand: 'Pear Fiction',
      },
      {
        title: '4 Spicy Frenzy',
        description: 'Cuatro chilis. Zero chill. Muy caliente. Muy mala idea. 🌶️🔥',
        videoUrl: 'https://www.youtube.com/watch?v=rtFKCbsXxrU',
        linkUrl: 'https://pearfiction.com/games/4-spicy-frenzy/',
        linkLabel: 'Game details',
        portfolioPreviewSrc: 'https://pearfiction.com/wp-content/uploads/2026/02/00208_4_spicy_frenzy.webp',
        portfolioPreviewBrand: 'Pear Fiction',
      },
      {
        title: 'Squealin Riches 2',
        description: 'They said the vault would never open again. They said the pig was just a myth. They were wrong. 🐷💰',
        videoUrl: 'https://www.youtube.com/watch?v=3d1btqurdH8',
        linkUrl: 'https://pearfiction.com/games/squealin-riches-2/',
        linkLabel: 'Game details',
        portfolioPreviewSrc: 'https://pearfiction.com/wp-content/uploads/2025/04/00177_squealin_riches_2.webp',
        portfolioPreviewBrand: 'Pear Fiction',
      },
      {
        title: 'Bunny Loot',
        description: 'Brace yourselves, players - Bunny Loot is on the loose! Chaos, carrots, and colossal wins await at every hop.',
        videoUrl: 'https://youtu.be/Uu620kJ-l9o?si=t2dkbcr4qNSDm11l',
        linkUrl: 'https://pearfiction.com/games/bunny-loot/',
        linkLabel: 'Game details',
        portfolioPreviewSrc: 'https://pearfiction.com/wp-content/uploads/2024/11/00181_bunny_loot.webp',
        portfolioPreviewBrand: 'Pear Fiction',
      },
      {
        title: 'Wild Lava',
        description: 'Wild Lava by Playtech is a tropical-themed slot game set on an island teetering on the edge of eruption.',
        videoUrl: 'https://www.youtube.com/watch?v=YDPTVYz6uhA',
        linkUrl: 'https://slot.day/playtech/wild-lava/',
        linkLabel: 'Game details',
        portfolioPreviewBrand: 'Playtech',
      },
      {
        title: 'Egypt Slot Game',
        description: 'Welcome to the mysterious world of ancient Egypt, where pharaohs, pyramids, and riches await!',
        videoUrl: 'https://drive.google.com/file/d/1GOokwaC4xvZ3EqZOJwhcAnTrZG0R2M5u/view?usp=drive_link',
        portfolioPreviewBrand: 'Room 8 Studio',
      },
    ],
  },
})
