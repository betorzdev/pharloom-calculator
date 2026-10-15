/* intro.js: Hornet's arrival and the title, the video's first bars. VID.intro(t, el): t in seconds
   from the video's start; the music's first big hit lands at VID.HIT. She falls in, lands hard on
   the hit (a flash, two rings on the floor, dust, the frame shaking), gets up and swings her
   needle into the challenge stance on the fourth beat, when the line wipes in (Albert's pick,
   option A of three, 15-Oct-2026). */
(function () {
  const V = window.VID;
  V.HIT = 0.8;                       // the section's first hit (Lace's theme, 56.91 s)
  const FLOOR = 940, X = 960, S = 1.9;

  function fallIn(ctx, t, hit) {
    // Falling from above the frame, accelerating, with a ghost trail.
    const k = V.prog(t, hit - 0.75, hit), y = V.lerp(FLOOR - 1250, FLOOR, V.easeIn(k));
    const i = V.frameAt('Fall', t - (hit - 0.75), 'tail');
    for (let g = 3; g >= 1; g--) V.drawHornet(ctx, 'Fall', i, X, y - g * 70 * k, S, { alpha: 0.12 * (4 - g) * k });
    V.drawHornet(ctx, 'Fall', i, X, y, S);
  }

  V.intro = (t, el) => {
    const { ctx } = el, hit = V.HIT, b4 = hit + 4 * V.BEAT;
    const [sx, sy] = V.shake(t, hit, 18);
    ctx.save(); ctx.translate(sx, sy);
    V.embers(ctx, t);
    if (t < hit) fallIn(ctx, t, hit);
    else {
      V.shock(ctx, t, hit, X, FLOOR + 4);
      V.shock(ctx, t, hit + 0.06, X, FLOOR + 4, { r: 700, dur: 0.45 });
      V.dust(ctx, t, hit, X, FLOOR);
      const cs = b4 - 2 / 12;   // the swing's arc frame on the fourth beat
      if (t < cs) V.drawHornet(ctx, 'HardLand', V.frameAt('HardLand', t - hit), X, FLOOR, S);
      else V.drawHornet(ctx, 'Challenge Strong', V.frameAt('Challenge Strong', t - cs, 'tail'), X, FLOOR, S);
    }
    ctx.restore();

    // The title slams in on the hit; the crown draws itself; the line wipes in on the fourth beat.
    const kt = V.prog(t, hit, hit + 0.16);
    el.title.style.opacity = kt;
    el.title.style.transform = `translate(${sx * 0.5}px,${sy * 0.5}px) scale(${V.lerp(1.45, 1, V.easeOut(kt))})`;
    el.title.style.filter = `blur(${(1 - kt) * 14}px)`;
    el.crown.style.setProperty('--draw', V.easeOut(V.prog(t, hit, hit + 0.9)));
    const kg = V.easeOut(V.prog(t, b4, b4 + 0.35));
    el.tag.style.clipPath = `inset(0 ${(1 - kg) * 100}% 0 0)`;
    el.tag.style.opacity = kg > 0 ? 1 : 0;
    return V.flash(t, hit, 0.14, 0.6);
  };
})();
