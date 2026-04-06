import { summarizeAnalyticsEvents } from "@/lib/analytics";

describe("analytics summary", () => {
  it("agrega totais, páginas e jogos mais acessados", () => {
    const baseDate = new Date("2026-04-05T12:00:00.000Z");
    const summary = summarizeAnalyticsEvents(
      [
        {
          type: "page_view",
          path: "/",
          sessionId: "s1",
          createdAt: new Date(baseDate.getTime() + 1_000),
        },
        {
          type: "page_view",
          path: "/games",
          sessionId: "s2",
          createdAt: new Date(baseDate.getTime() + 2_000),
        },
        {
          type: "page_view",
          path: "/",
          sessionId: "s3",
          createdAt: new Date(baseDate.getTime() + 3_000),
        },
        {
          type: "page_view",
          path: "/",
          sessionId: "s4",
          createdAt: new Date(baseDate.getTime() + 4_000),
        },
        {
          type: "page_view",
          path: "/",
          sessionId: "s5",
          createdAt: new Date(baseDate.getTime() + 5_000),
        },
        {
          type: "home_click",
          path: "/home/hero/recommended/cyber-drift-racer",
          sessionId: "s1",
          createdAt: new Date(baseDate.getTime() + 6_000),
        },
        {
          type: "home_click",
          path: "/home/hero/recommended/cyber-drift-racer",
          sessionId: "s2",
          createdAt: new Date(baseDate.getTime() + 7_000),
        },
        {
          type: "home_click",
          path: "/home/category/racing",
          sessionId: "s1",
          createdAt: new Date(baseDate.getTime() + 8_000),
        },
        {
          type: "home_click",
          path: "/home/section/recommended/galaxy-defender",
          sessionId: "s3",
          createdAt: new Date(baseDate.getTime() + 9_000),
        },
        {
          type: "home_click",
          path: "/home/blog/seo-para-sites-de-jogos-online",
          sessionId: "s3",
          createdAt: new Date(baseDate.getTime() + 10_000),
        },
        {
          type: "home_click",
          path: "/home/cta/register",
          sessionId: "s4",
          createdAt: new Date(baseDate.getTime() + 11_000),
        },
        {
          type: "home_click",
          path: "/home/guest/action",
          sessionId: "s5",
          createdAt: new Date(baseDate.getTime() + 12_000),
        },
        {
          type: "game_view",
          path: "/games/cyber-drift-racer",
          sessionId: "s1",
          referrer: "http://localhost:3000/category/racing",
          createdAt: new Date(baseDate.getTime() + 13_000),
          gameId: "g1",
          gameTitle: "Cyber Drift Racer",
          gameSlug: "cyber-drift-racer",
        },
        {
          type: "favorite_add",
          path: "/games/cyber-drift-racer",
          sessionId: "s1",
          referrer: "/games/cyber-drift-racer",
          createdAt: new Date(baseDate.getTime() + 14_000),
        },
        {
          type: "game_view",
          path: "/games/galaxy-defender",
          sessionId: "s3",
          referrer: "http://localhost:3000/blog/seo-para-sites-de-jogos-online",
          createdAt: new Date(baseDate.getTime() + 15_000),
          gameId: "g2",
          gameTitle: "Galaxy Defender",
          gameSlug: "galaxy-defender",
        },
        {
          type: "player_register",
          path: "/login?mode=register",
          sessionId: "s4",
          referrer: "http://localhost:3000/",
          createdAt: new Date(baseDate.getTime() + 16_000),
        },
        {
          type: "player_login",
          path: "/login",
          sessionId: "s5",
          referrer: "http://localhost:3000/",
          createdAt: new Date(baseDate.getTime() + 17_000),
        },
      ],
      3,
    );

    expect(summary.totals.pageViews).toBe(5);
    expect(summary.totals.homeClicks).toBe(7);
    expect(summary.totals.gameViews).toBe(2);
    expect(summary.totals.favoritesAdded).toBe(1);
    expect(summary.totals.playerLogins).toBe(1);
    expect(summary.totals.playerRegistrations).toBe(1);
    expect(summary.totals.uniqueSessions).toBe(5);
    expect(summary.topPages[0]).toEqual({ path: "/", views: 4 });
    expect(summary.topPages[1]).toEqual({ path: "/games", views: 1 });
    expect(summary.topHomeInteractions[0]).toEqual({
      path: "/home/hero/recommended/cyber-drift-racer",
      clicks: 2,
    });
    expect(summary.timeline.at(-1)).toMatchObject({
      date: "2026-04-05",
      pageViews: 5,
      homeClicks: 7,
      gameViews: 2,
      favoritesAdded: 1,
      playerLogins: 1,
      playerRegistrations: 1,
    });
    expect(summary.homeFunnel.homeViews).toBe(4);
    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "hero")).toMatchObject({
      clicks: 2,
      uniqueSessions: 2,
      playSessions: 0,
      favoriteSessions: 1,
      loginSessions: 0,
      registerSessions: 0,
      acquisitionSessions: 0,
      firstAcquisitionSessions: 0,
      assistedAcquisitionSessions: 0,
      actionSessions: 1,
      conversionRate: 50,
      playConversionRate: 0,
      favoriteConversionRate: 50,
      loginConversionRate: 0,
      registerConversionRate: 0,
      acquisitionConversionRate: 0,
      firstAcquisitionRate: 0,
      assistedAcquisitionRate: 0,
      actionConversionRate: 50,
      shareOfHomeClicks: 28.6,
    });
    expect(
      summary.homeFunnel.blocks.find((entry) => entry.block === "categories"),
    ).toMatchObject({
      clicks: 1,
      uniqueSessions: 1,
      playSessions: 1,
      favoriteSessions: 0,
      loginSessions: 0,
      registerSessions: 0,
      acquisitionSessions: 0,
      firstAcquisitionSessions: 0,
      assistedAcquisitionSessions: 0,
      actionSessions: 1,
      conversionRate: 25,
      playConversionRate: 100,
      favoriteConversionRate: 0,
      loginConversionRate: 0,
      registerConversionRate: 0,
      acquisitionConversionRate: 0,
      firstAcquisitionRate: 0,
      assistedAcquisitionRate: 0,
      actionConversionRate: 100,
      shareOfHomeClicks: 14.3,
    });
    expect(
      summary.homeFunnel.blocks.find((entry) => entry.block === "recommended"),
    ).toMatchObject({
      clicks: 1,
      uniqueSessions: 1,
      playSessions: 0,
      favoriteSessions: 0,
      loginSessions: 0,
      registerSessions: 0,
      acquisitionSessions: 0,
      firstAcquisitionSessions: 0,
      assistedAcquisitionSessions: 0,
      actionSessions: 0,
      conversionRate: 25,
      playConversionRate: 0,
      favoriteConversionRate: 0,
      loginConversionRate: 0,
      registerConversionRate: 0,
      acquisitionConversionRate: 0,
      firstAcquisitionRate: 0,
      assistedAcquisitionRate: 0,
      actionConversionRate: 0,
      shareOfHomeClicks: 14.3,
    });
    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "blog")).toMatchObject({
      clicks: 1,
      uniqueSessions: 1,
      playSessions: 1,
      favoriteSessions: 0,
      loginSessions: 0,
      registerSessions: 0,
      acquisitionSessions: 0,
      firstAcquisitionSessions: 0,
      assistedAcquisitionSessions: 0,
      actionSessions: 1,
      conversionRate: 25,
      playConversionRate: 100,
      favoriteConversionRate: 0,
      loginConversionRate: 0,
      registerConversionRate: 0,
      acquisitionConversionRate: 0,
      firstAcquisitionRate: 0,
      assistedAcquisitionRate: 0,
      actionConversionRate: 100,
      shareOfHomeClicks: 14.3,
    });
    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "cta")).toMatchObject({
      clicks: 1,
      uniqueSessions: 1,
      playSessions: 0,
      favoriteSessions: 0,
      loginSessions: 0,
      registerSessions: 1,
      acquisitionSessions: 1,
      firstAcquisitionSessions: 1,
      assistedAcquisitionSessions: 0,
      actionSessions: 1,
      conversionRate: 25,
      playConversionRate: 0,
      favoriteConversionRate: 0,
      loginConversionRate: 0,
      registerConversionRate: 100,
      acquisitionConversionRate: 100,
      firstAcquisitionRate: 100,
      assistedAcquisitionRate: 0,
      actionConversionRate: 100,
      shareOfHomeClicks: 14.3,
    });
    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "mission")).toMatchObject({
      clicks: 1,
      uniqueSessions: 1,
      playSessions: 0,
      favoriteSessions: 0,
      loginSessions: 1,
      registerSessions: 0,
      acquisitionSessions: 1,
      firstAcquisitionSessions: 1,
      assistedAcquisitionSessions: 0,
      actionSessions: 1,
      conversionRate: 25,
      playConversionRate: 0,
      favoriteConversionRate: 0,
      loginConversionRate: 100,
      registerConversionRate: 0,
      acquisitionConversionRate: 100,
      firstAcquisitionRate: 100,
      assistedAcquisitionRate: 0,
      actionConversionRate: 100,
      shareOfHomeClicks: 14.3,
    });
    expect(summary.topGames[0]).toEqual({
      gameId: "g1",
      title: "Cyber Drift Racer",
      slug: "cyber-drift-racer",
      views: 1,
    });
  });

  it("usa destinationPath explícito e separa aquisição direta, primeiro toque e assistida", () => {
    const baseDate = new Date("2026-04-05T13:00:00.000Z");
    const summary = summarizeAnalyticsEvents(
      [
        {
          type: "page_view",
          path: "/",
          sessionId: "s10",
          createdAt: new Date(baseDate.getTime() + 1_000),
        },
        {
          type: "home_click",
          path: "/home/hero/featured/cyber-drift-racer",
          destinationPath: "/games/cyber-drift-racer",
          sessionId: "s10",
          createdAt: new Date(baseDate.getTime() + 2_000),
        },
        {
          type: "home_click",
          path: "/home/blog/seo-para-sites-de-jogos-online",
          destinationPath: "/blog/seo-para-sites-de-jogos-online",
          sessionId: "s10",
          createdAt: new Date(baseDate.getTime() + 3_000),
        },
        {
          type: "home_click",
          path: "/home/cta/register-alt",
          destinationPath: "/login?mode=register",
          sessionId: "s10",
          createdAt: new Date(baseDate.getTime() + 4_000),
        },
        {
          type: "player_register",
          path: "/login?mode=register",
          sessionId: "s10",
          referrer: "http://localhost:3000/",
          createdAt: new Date(baseDate.getTime() + 5_000),
        },
      ],
      3,
    );

    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "hero")).toMatchObject({
      firstAcquisitionSessions: 1,
      acquisitionSessions: 0,
      assistedAcquisitionSessions: 0,
    });
    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "blog")).toMatchObject({
      firstAcquisitionSessions: 0,
      acquisitionSessions: 0,
      assistedAcquisitionSessions: 1,
    });
    expect(summary.homeFunnel.blocks.find((entry) => entry.block === "cta")).toMatchObject({
      registerSessions: 1,
      acquisitionSessions: 1,
      firstAcquisitionSessions: 0,
      assistedAcquisitionSessions: 0,
    });
  });

  it("resume performance do blog por post e origem", () => {
    const baseDate = new Date("2026-04-05T14:00:00.000Z");
    const summary = summarizeAnalyticsEvents(
      [
        {
          type: "blog_impression",
          path: "/",
          destinationPath: "/blog/loops-de-retencao",
          sessionId: "b1",
          createdAt: new Date(baseDate.getTime() + 1_000),
        },
        {
          type: "blog_click",
          path: "/",
          destinationPath: "/blog/loops-de-retencao",
          sessionId: "b1",
          createdAt: new Date(baseDate.getTime() + 2_000),
        },
        {
          type: "blog_view",
          path: "/blog/loops-de-retencao",
          sessionId: "b1",
          referrer: "http://localhost:3000/",
          createdAt: new Date(baseDate.getTime() + 3_000),
        },
        {
          type: "blog_impression",
          path: "/blog",
          destinationPath: "/blog/loops-de-retencao",
          sessionId: "b2",
          createdAt: new Date(baseDate.getTime() + 4_000),
        },
        {
          type: "blog_click",
          path: "/blog",
          destinationPath: "/blog/loops-de-retencao",
          sessionId: "b2",
          createdAt: new Date(baseDate.getTime() + 5_000),
        },
        {
          type: "blog_view",
          path: "/blog/loops-de-retencao",
          sessionId: "b2",
          referrer: "http://localhost:3000/blog",
          createdAt: new Date(baseDate.getTime() + 6_000),
        },
        {
          type: "blog_impression",
          path: "/",
          destinationPath: "/blog/feed-vertical-de-jogos",
          sessionId: "b3",
          createdAt: new Date(baseDate.getTime() + 7_000),
        },
      ],
      3,
    );

    expect(summary.totals.blogImpressions).toBe(3);
    expect(summary.totals.blogClicks).toBe(2);
    expect(summary.totals.blogViews).toBe(2);
    expect(summary.totals.blogCtr).toBe(66.7);
    expect(summary.timeline.at(-1)).toMatchObject({
      date: "2026-04-05",
      blogImpressions: 3,
      blogClicks: 2,
      blogViews: 2,
    });
    expect(summary.blogPerformance.topSources[0]).toEqual({
      path: "/",
      impressions: 2,
      clicks: 1,
      views: 1,
      ctr: 50,
      clickToViewRate: 100,
    });
    expect(summary.blogPerformance.posts[0]).toMatchObject({
      slug: "loops-de-retencao",
      path: "/blog/loops-de-retencao",
      impressions: 2,
      clicks: 2,
      views: 2,
      ctr: 100,
      clickToViewRate: 100,
      topSource: "/",
    });
    expect(summary.blogPerformance.posts[0]?.sources).toEqual([
      {
        path: "/",
        impressions: 1,
        clicks: 1,
        views: 1,
        ctr: 100,
        clickToViewRate: 100,
      },
      {
        path: "/blog",
        impressions: 1,
        clicks: 1,
        views: 1,
        ctr: 100,
        clickToViewRate: 100,
      },
    ]);
  });
});