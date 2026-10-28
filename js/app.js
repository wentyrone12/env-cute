const KEY = "whisper_envelopes_v1", $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const ENV = ["#e994b7", "#f3a6a6", "#f2c879", "#a995d9", "#8db7d9", "#8dc7b0", "#d5aa76", "#d88383"];
const PAPER = ["#fffaf2", "#fff1f6", "#f5efff", "#edf8ff", "#effbf3", "#fff7df"];
// 144 additional premium tones for each palette; generated locally (no extra API or assets).
// Keep original Free colors at the start so existing envelopes render exactly as before.
function paletteHex(hue, saturation, lightness) {
  const s = saturation / 100, l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = n => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
const PREMIUM_ENV_TONES = Object.freeze(Array.from({ length: 24 }, (_, h) => [
  [38, 70], [64, 62], [75, 53], [68, 43], [58, 35], [52, 79]
].map(([s, l]) => paletteHex(h * 15, s, l))).flat());
const PREMIUM_PAPER_TONES = Object.freeze(Array.from({ length: 24 }, (_, h) => [
  [33, 97], [46, 95], [57, 93], [69, 91], [74, 89], [49, 87]
].map(([s, l]) => paletteHex(h * 15, s, l))).flat());
const fullColors = kind => [...new Set([...(kind === 'envelope' ? ENV : PAPER), ...(kind === 'envelope' ? PREMIUM_ENV_TONES : PREMIUM_PAPER_TONES)])];

const ROT = [-2, 2, -4, 3, -1], calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hexOk = c => /^#[0-9a-f]{6}$/i.test(c), uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmt = d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const shade = (h, p) => { const t = p < 0 ? 0 : 255, k = Math.abs(p); return "#" + [1, 3, 5].map(i => Math.round(parseInt(h.substr(i, 2), 16) * (1 - k) + t * k).toString(16).padStart(2, "0")).join("") };
const vars = c => `--c:${c};--cl:${shade(c, .3)};--cf:${shade(c, -.07)};--cd:${shade(c, -.2)}`;
const SIGNATURE_STYLES = [
  { name: "Classic", font: '"Caveat",cursive' },
  { name: "Dancing", font: '"Dancing Script",cursive' },
  { name: "Elegant", font: '"Great Vibes",cursive' },
  { name: "Playful", font: '"Pacifico",cursive' },
  { name: "Flowing", font: '"Satisfy",cursive' },
  { name: "Allura", font: '"Allura",cursive' },
  { name: "Sacramento", font: '"Sacramento",cursive' },
  { name: "Parisienne", font: '"Parisienne",cursive' },
  { name: "Bold ink", font: '"Kaushan Script",cursive' },
  { name: "Calligraphy", font: '"Cormorant Garamond",serif' }
];
const safeImage = src => typeof src === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src) && src.length < 190000 ? src : null;
const PHOTO_STYLES = [
  { id: 'classic', name: 'Classic', desc: 'Timeless cream' },
  { id: 'blush', name: 'Blush', desc: 'Soft pink ribbon' },
  { id: 'film', name: 'Film', desc: 'Vintage film' },
  { id: 'scrapbook', name: 'Scrapbook', desc: 'Washi-tape look' },
  { id: 'modern', name: 'Dreamy', desc: 'Rounded glass' },
  { id: 'rose-gold', name: 'Rose Gold', desc: 'Metallic rose frame' },
  { id: 'midnight', name: 'Midnight', desc: 'Deep navy glow' },
  { id: 'lavender', name: 'Lavender', desc: 'Pastel lilac border' },
  { id: 'sunflower', name: 'Sunflower', desc: 'Warm yellow bloom' },
  { id: 'ocean', name: 'Ocean', desc: 'Soft coastal blues' },
  { id: 'forest', name: 'Forest', desc: 'Woodland greens' },
  { id: 'neon', name: 'Neon Glow', desc: 'Electric gradient edge' },
  { id: 'pearl', name: 'Pearl', desc: 'Iridescent finish' },
  { id: 'vintage', name: 'Vintage', desc: 'Antique parchment' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean editorial lines' },
  { id: 'comic', name: 'Comic Pop', desc: 'Bold graphic outline' },
  { id: 'lace', name: 'Lace', desc: 'Delicate dotted edge' },
  { id: 'galaxy', name: 'Galaxy', desc: 'Cosmic violet' },
  { id: 'polka', name: 'Polka Dot', desc: 'Playful confetti' },
  { id: 'sunset', name: 'Sunset', desc: 'Coral-to-gold glow' },
  { id: 'marble', name: 'Marble', desc: 'Soft stone luxury' },
  { id: 'retro', name: 'Retro 90s', desc: 'Color-block nostalgia' },
  { id: 'gold', name: 'Golden Hour', desc: 'Golden framed edge' },
  { id: 'frost', name: 'Frosted', desc: 'Icy translucent look' }
,
  { id: 'torn-rose', name: 'Torn Rose', desc: 'Hand-ripped blush paper' },
  { id: 'torn-kraft', name: 'Torn Kraft', desc: 'Recycled deckled paper' },
  { id: 'torn-cloud', name: 'Cloud Torn', desc: 'Soft fluffy paper edges' },
  { id: 'torn-lilac', name: 'Lavender Tear', desc: 'Hand-cut lavender cardstock' },
  { id: 'torn-parchment', name: 'Old Letter', desc: 'Aged uneven parchment' },
  { id: 'torn-mint', name: 'Mint Tear', desc: 'Fresh pastel ripped edge' },
  { id: 'ticket-pink', name: 'Pink Ticket', desc: 'Perforated ticket border' },
  { id: 'ticket-gold', name: 'Golden Ticket', desc: 'Warm concert-ticket edge' },
  { id: 'ticket-blue', name: 'Blue Ticket', desc: 'Perforated keepsake' },
  { id: 'ticket-ivory', name: 'Ivory Ticket', desc: 'Vintage ticket stub' },
  { id: 'ticket-lilac', name: 'Violet Ticket', desc: 'Playful ticket border' },
  { id: 'ticket-coral', name: 'Coral Ticket', desc: 'Event-style torn receipt' },
  { id: 'sticker-rose', name: 'Rose Sticker', desc: 'Sticker-cut pink outline' },
  { id: 'sticker-sky', name: 'Sky Sticker', desc: 'Blue die-cut frame' },
  { id: 'sticker-honey', name: 'Honey Sticker', desc: 'Golden label outline' },
  { id: 'sticker-mint', name: 'Mint Sticker', desc: 'Leafy sticker edge' },
  { id: 'sticker-peach', name: 'Peach Sticker', desc: 'Warm label shape' },
  { id: 'sticker-grape', name: 'Grape Sticker', desc: 'Grape-tinted frame' },
  { id: 'postcard-rose', name: 'Rose Postcard', desc: 'Vintage postcard edge' },
  { id: 'postcard-sepia', name: 'Sepia Postcard', desc: 'Classic antique edge' },
  { id: 'postcard-sea', name: 'Sea Postcard', desc: 'Ocean postcard memory' },
  { id: 'postcard-peach', name: 'Peach Postcard', desc: 'Warm faded corners' },
  { id: 'postcard-night', name: 'Night Postcard', desc: 'Midnight travel stamp' },
  { id: 'postcard-sage', name: 'Sage Postcard', desc: 'Botanical postcard' },
  { id: 'scallop-blush', name: 'Blush Scallop', desc: 'Wavy scalloped paper' },
  { id: 'scallop-cream', name: 'Cream Scallop', desc: 'Rounded cut edges' },
  { id: 'scallop-petal', name: 'Petal Scallop', desc: 'Floral cut-paper frame' },
  { id: 'scallop-ice', name: 'Ice Scallop', desc: 'Cool frosted edges' },
  { id: 'scallop-sage', name: 'Sage Scallop', desc: 'Gentle leaf edges' },
  { id: 'scallop-gold', name: 'Gold Scallop', desc: 'Golden doily cut' },
  { id: 'tape-lilac', name: 'Lilac Washi', desc: 'Craft paper and tape' },
  { id: 'tape-pink', name: 'Pink Washi', desc: 'Washi tape keepsake' },
  { id: 'tape-check', name: 'Gingham Tape', desc: 'Checked scrapbook detail' },
  { id: 'tape-sun', name: 'Sun Washi', desc: 'Golden tape paper' },
  { id: 'tape-ocean', name: 'Ocean Washi', desc: 'Sea-colored tape accent' },
  { id: 'tape-sage', name: 'Sage Washi', desc: 'Green handmade tape' }
];
const PHOTO_LAYOUTS = [
  { id: 'stack', name: 'Classic Stack', desc: 'Layered keepsakes' },
  { id: 'fan', name: 'Sweet Fan', desc: 'Fanned out cards' },
  { id: 'stair', name: 'Staircase', desc: 'Diagonal memories' },
  { id: 'ribbon', name: 'Ribbon', desc: 'Wavy overlapping row' },
  { id: 'petal', name: 'Petal Bloom', desc: 'Petal-shaped collage' },
  { id: 'orbit', name: 'Orbit', desc: 'Photos circle the center' },
  { id: 'diamond', name: 'Diamond', desc: 'Four-corner silhouette' },
  { id: 'cascade', name: 'Cascade', desc: 'Falling photo layers' },
  { id: 'zigzag', name: 'Zigzag', desc: 'Alternating left and right' },
  { id: 'gallery', name: 'Gallery Wall', desc: 'Straight exhibition arrangement' },
  { id: 'heart', name: 'Heart', desc: 'Heart-shaped cluster' },
  { id: 'butterfly', name: 'Butterfly', desc: 'Mirrored angled wings' },
  { id: 'cross', name: 'Cross', desc: 'Interlocking photo cross' },
  { id: 'wave', name: 'Ocean Wave', desc: 'Flowing photo rhythm' },
  { id: 'mosaic', name: 'Mosaic', desc: 'Offset tile formation' },
  { id: 'book', name: 'Open Book', desc: 'Paired page spread' },
  { id: 'pyramid', name: 'Pyramid', desc: 'Tiered center composition' },
  { id: 'sunburst', name: 'Sunburst', desc: 'Radiating fan shape' },
  { id: 'arc', name: 'Soft Arc', desc: 'Curved photo arrangement' },
  { id: 'shelf', name: 'Photo Shelf', desc: 'Straight-line display' },
  { id: 'twin', name: 'Twin Columns', desc: 'Paired column symmetry' },
  { id: 'scatter', name: 'Confetti', desc: 'Playful scattered photos' },
  { id: 'bridge', name: 'Bridge', desc: 'Arch between memories' },
  { id: 'pinwheel', name: 'Pinwheel', desc: 'Rotating blossom layout' }
,
  { id: 'terrace', name: 'Terrace', desc: 'Ascending little windows' },
  { id: 'terrace-soft', name: 'Soft Terrace', desc: 'Gentle diagonal steps' },
  { id: 'terrace-wide', name: 'Wide Terrace', desc: 'Stretched rhythmic offset' },
  { id: 'terrace-flip', name: 'Flip Terrace', desc: 'Alternating tilts' },
  { id: 'terrace-rose', name: 'Rose Terrace', desc: 'Staggered keepsakes' },
  { id: 'terrace-narrow', name: 'Narrow Terrace', desc: 'Tight staircase' },
  { id: 'constellation', name: 'Constellation', desc: 'Star-like constellation' },
  { id: 'constellation-east', name: 'Eastern Stars', desc: 'Stars shifting right' },
  { id: 'constellation-west', name: 'Western Stars', desc: 'Stars shifting left' },
  { id: 'constellation-dream', name: 'Dream Stars', desc: 'Orbiting diagonal cards' },
  { id: 'constellation-spark', name: 'Spark Trail', desc: 'Sparkle trails' },
  { id: 'constellation-night', name: 'Night Sky', desc: 'Wide star pattern' },
  { id: 'tiles', name: 'Photo Tiles', desc: 'Compact asymmetrical grid' },
  { id: 'tiles-offset', name: 'Offset Tiles', desc: 'Gentle staggered grid' },
  { id: 'tiles-rhythm', name: 'Rhythm Tiles', desc: 'Alternating grid edges' },
  { id: 'tiles-art', name: 'Art Tiles', desc: 'Editorial tiled wall' },
  { id: 'tiles-corner', name: 'Corner Tiles', desc: 'Angular mosaic layout' },
  { id: 'tiles-window', name: 'Window Tiles', desc: 'Cozy window collection' },
  { id: 'bouquet', name: 'Memory Bouquet', desc: 'Radiating flowers' },
  { id: 'bouquet-rose', name: 'Rose Bouquet', desc: 'Tight floral fan' },
  { id: 'bouquet-wide', name: 'Wide Bouquet', desc: 'Spread petals' },
  { id: 'bouquet-daisy', name: 'Daisy Bouquet', desc: 'Circle of memories' },
  { id: 'bouquet-pink', name: 'Pink Bouquet', desc: 'Swirled paper petals' },
  { id: 'bouquet-ribbon', name: 'Ribbon Bouquet', desc: 'Soft pinwheel fan' },
  { id: 'journey', name: 'Journey', desc: 'Adventure trail photographs' },
  { id: 'journey-hill', name: 'Hill Trail', desc: 'Hiking photograph trail' },
  { id: 'journey-sunset', name: 'Sunset Trail', desc: 'Curved sunset memories' },
  { id: 'journey-bridge', name: 'Memory Bridge', desc: 'Arch to arch sequence' },
  { id: 'journey-wave', name: 'Winding Trail', desc: 'Meandering pictures' },
  { id: 'journey-story', name: 'Story Trail', desc: 'A flowing photo story' },
  { id: 'collage', name: 'Art Collage', desc: 'Artfully scattered frames' },
  { id: 'collage-soft', name: 'Soft Collage', desc: 'Little overlapping pieces' },
  { id: 'collage-zine', name: 'Zine Collage', desc: 'Editorial magazine arrangement' },
  { id: 'collage-diagonal', name: 'Diagonal Collage', desc: 'Dynamic diagonal design' },
  { id: 'collage-frame', name: 'Gallery Collage', desc: 'Tidy curated spread' },
  { id: 'collage-confetti', name: 'Party Collage', desc: 'Playful dancing cards' }
];
// Each premium layout defines card positions, rotation and layering.
// Keep the coordinates bounded for narrow mobile paper previews.
const EXTRA_PHOTO_LAYOUT_POSITIONS = {
  orbit: [[-38, 4, -17], [37, 4, 17], [-43, 42, 10], [39, 43, -10]],
  diamond: [[0, 1, -3], [-49, 24, -17], [49, 24, 17], [0, 52, 3]],
  cascade: [[-47, 0, -8], [-15, 15, -4], [19, 31, 5], [49, 46, 9]],
  zigzag: [[-44, 2, -10], [44, 15, 11], [-42, 32, -7], [44, 46, 9]],
  gallery: [[-50, 6, 0], [50, 6, 0], [-50, 44, 0], [50, 44, 0]],
  heart: [[-38, 8, -19], [38, 8, 19], [-27, 39, -8], [28, 42, 8]],
  butterfly: [[-45, 4, -25], [45, 4, 25], [-40, 44, 19], [40, 44, -19]],
  cross: [[0, 0, 0], [-48, 24, -10], [48, 24, 10], [0, 50, 0]],
  wave: [[-53, 25, -13], [-19, 2, 3], [20, 25, 12], [52, 4, -5]],
  mosaic: [[-48, 0, 0], [38, 12, 4], [-36, 36, -3], [47, 46, 0]],
  book: [[-43, 5, -13], [43, 5, 13], [-42, 40, -7], [43, 40, 7]],
  pyramid: [[0, 0, 0], [-50, 39, -13], [50, 39, 13], [0, 55, 0]],
  sunburst: [[-48, 17, -26], [-18, 1, -11], [19, 1, 11], [48, 17, 26]],
  arc: [[-52, 31, -19], [-19, 5, -7], [19, 5, 7], [52, 31, 19]],
  shelf: [[-53, 22, -1], [-18, 22, 0], [18, 22, 0], [53, 22, 1]],
  twin: [[-45, 7, -8], [45, 7, 8], [-45, 43, 8], [45, 43, -8]],
  scatter: [[-49, 5, 18], [38, 0, -13], [-22, 44, -16], [53, 36, 16]],
  bridge: [[-51, 48, -17], [-17, 12, -5], [17, 12, 5], [51, 48, 17]],
  pinwheel: [[0, 0, -22], [44, 22, 22], [0, 49, -20], [-44, 25, 20]],
};
const safePhotoStyle = style => PHOTO_STYLES.some(v => v.id === style) ? style : 'classic';
const safePhotoLayout = layout => PHOTO_LAYOUTS.some(v => v.id === layout) ? layout : 'stack';
const safeCode = code => typeof code === 'string' && /^[a-z0-9-]{4,32}$/.test(code) ? code : '';
const DEFAULT_COVER_TEXT = 'Welcome to W-Envelope Cute';
const INTRO_PRESETS = Object.freeze([
  { id: 'bouquet', name: 'Bouquet reveal', category: 'Flowers', emoji: '💐', particles: '💐 🌷 🌸 ✿', motion: 'burst', heroMotion: 'bounce', bg1: '#fff0f8', bg2: '#eadffa' },
  { id: 'rose-rain', name: 'Rose rainfall', category: 'Flowers', emoji: '🌹', particles: '🌹 🌹 💗', motion: 'rain', heroMotion: 'bounce', bg1: '#ffe5ef', bg2: '#f8d1df' },
  { id: 'sakura', name: 'Sakura breeze', category: 'Flowers', emoji: '🌸', particles: '🌸 🌺 🌸', motion: 'wave', heroMotion: 'spin', bg1: '#fff1fa', bg2: '#fae2ef' },
  { id: 'tulip', name: 'Tulip garden', category: 'Flowers', emoji: '🌷', particles: '🌷 🌼 🌷', motion: 'float', heroMotion: 'bounce', bg1: '#fff0f5', bg2: '#dff6e9' },
  { id: 'sunflower', name: 'Sunshine flowers', category: 'Flowers', emoji: '🌻', particles: '🌻 🌼 ✨', motion: 'burst', heroMotion: 'spin', bg1: '#fff9de', bg2: '#ffdcaa' },
  { id: 'lavender', name: 'Lavender dreams', category: 'Flowers', emoji: '🪻', particles: '🪻 ✧ 💜', motion: 'orbit', heroMotion: 'glow', bg1: '#f8edff', bg2: '#d9d0fb' },
  { id: 'wreath', name: 'Flower wreath', category: 'Flowers', emoji: '💐', particles: '🌸 🌷 🌼', motion: 'orbit', heroMotion: 'pulse', bg1: '#fff5f8', bg2: '#e9f2ff' },
  { id: 'petal-whirl', name: 'Petal whirlwind', category: 'Flowers', emoji: '🌺', particles: '🌺 🌸 ✿', motion: 'spiral', heroMotion: 'spin', bg1: '#ffeafa', bg2: '#f5e2f3' },
  { id: 'giant-heart', name: 'Giant beating heart', category: 'Hearts', emoji: '❤️', particles: '💗 💕 ❤️', motion: 'burst', heroMotion: 'pulse', bg1: '#ffe6ee', bg2: '#ffafcf' },
  { id: 'heart-rain', name: 'Heart rain', category: 'Hearts', emoji: '💞', particles: '♥ 💗 💖', motion: 'rain', heroMotion: 'glow', bg1: '#fff0f5', bg2: '#ffd7e8' },
  { id: 'heartburst', name: 'Love explosion', category: 'Hearts', emoji: '💖', particles: '💖 💘 ✨', motion: 'burst', heroMotion: 'bounce', bg1: '#fff0f5', bg2: '#ecc8fc' },
  { id: 'pink-pulse', name: 'Pink heartbeat', category: 'Hearts', emoji: '💕', particles: '💕 💗 ♡', motion: 'float', heroMotion: 'pulse', bg1: '#ffe9f5', bg2: '#f5d7ff' },
  { id: 'heart-orbit', name: 'Orbit of love', category: 'Hearts', emoji: '💝', particles: '♥ ♡ 💕', motion: 'orbit', heroMotion: 'spin', bg1: '#fff1f8', bg2: '#e6d9fd' },
  { id: 'cupid', name: 'Cupid surprise', category: 'Hearts', emoji: '💘', particles: '💘 💕 ✨', motion: 'wave', heroMotion: 'bounce', bg1: '#fff4ef', bg2: '#ffdbed' },
  { id: 'ribbon-love', name: 'Ribbon romance', category: 'Hearts', emoji: '🎀', particles: '🎀 💗 ♡', motion: 'curtain', heroMotion: 'spin', bg1: '#fff2f8', bg2: '#f1e4ff' },
  { id: 'heart-balloon', name: 'Floating hearts', category: 'Hearts', emoji: '💗', particles: '💗 💜 💞', motion: 'float', heroMotion: 'bounce', bg1: '#ffeaf3', bg2: '#ddecff' },
  { id: 'stardust', name: 'Stardust reveal', category: 'Magic', emoji: '✨', particles: '✦ ✧ ✨', motion: 'float', heroMotion: 'glow', bg1: '#fbf6ff', bg2: '#dad3fd' },
  { id: 'sparkles', name: 'Sparkle burst', category: 'Magic', emoji: '🌟', particles: '✨ ✨ ⭐', motion: 'burst', heroMotion: 'glow', bg1: '#fff9e8', bg2: '#efe0ff' },
  { id: 'moon', name: 'Moonlight wish', category: 'Magic', emoji: '🌙', particles: '🌙 ✦ ⭐', motion: 'orbit', heroMotion: 'glow', bg1: '#edf0ff', bg2: '#bfcce8' },
  { id: 'galaxy', name: 'Mini galaxy', category: 'Magic', emoji: '🌌', particles: '🌠 ⭐ ✨', motion: 'spiral', heroMotion: 'spin', bg1: '#e3e2ff', bg2: '#b3addd' },
  { id: 'aurora', name: 'Aurora dream', category: 'Magic', emoji: '🪄', particles: '✨ 💜 🌟', motion: 'wave', heroMotion: 'glow', bg1: '#e7f8f5', bg2: '#e2d9ff' },
  { id: 'shooting-star', name: 'Shooting stars', category: 'Magic', emoji: '🌠', particles: '⭐ ✨ 🌠', motion: 'wave', heroMotion: 'bounce', bg1: '#e9e7ff', bg2: '#c8d3ff' },
  { id: 'rainbow', name: 'Rainbow magic', category: 'Magic', emoji: '🌈', particles: '🌈 ✨ 🌼', motion: 'curtain', heroMotion: 'bounce', bg1: '#fff5dc', bg2: '#e8e4ff' },
  { id: 'magic-wand', name: 'Magic wand', category: 'Magic', emoji: '🪄', particles: '✨ ✧ ⭐', motion: 'burst', heroMotion: 'spin', bg1: '#f4e5ff', bg2: '#c9d5ff' },
  { id: 'butterfly', name: 'Butterfly kiss', category: 'Cute', emoji: '🦋', particles: '🦋 🌸 ✧', motion: 'wave', heroMotion: 'bounce', bg1: '#fff0fa', bg2: '#e3efff' },
  { id: 'butterfly-dance', name: 'Butterfly dance', category: 'Cute', emoji: '🦋', particles: '🦋 🦋 ✨', motion: 'orbit', heroMotion: 'spin', bg1: '#e9f7ff', bg2: '#fbe5ff' },
  { id: 'bubbles', name: 'Sweet bubbles', category: 'Cute', emoji: '🫧', particles: '🫧 ◯ ✧', motion: 'float', heroMotion: 'pulse', bg1: '#e4fbff', bg2: '#efecff' },
  { id: 'teddy', name: 'Teddy hug', category: 'Cute', emoji: '🧸', particles: '♡ 💗 💕', motion: 'burst', heroMotion: 'bounce', bg1: '#fff2e6', bg2: '#fbe2eb' },
  { id: 'gift', name: 'Gift surprise', category: 'Cute', emoji: '🎁', particles: '🎁 ✨ 💗', motion: 'burst', heroMotion: 'bounce', bg1: '#fff5ee', bg2: '#efddfa' },
  { id: 'love-letter', name: 'Flying love notes', category: 'Cute', emoji: '💌', particles: '💌 ♥ ✉', motion: 'curtain', heroMotion: 'spin', bg1: '#fff4ef', bg2: '#f7e2f2' },
  { id: 'diamonds', name: 'Diamond sparkle', category: 'Elegant', emoji: '💎', particles: '💎 ✦ 💠', motion: 'rain', heroMotion: 'glow', bg1: '#eaf8ff', bg2: '#d9e2ff' },
  { id: 'pearls', name: 'Pearl shimmer', category: 'Elegant', emoji: '🤍', particles: '○ 🤍 ✧', motion: 'orbit', heroMotion: 'glow', bg1: '#fffafd', bg2: '#e8e5f0' },
  { id: 'golden', name: 'Golden glow', category: 'Elegant', emoji: '✨', particles: '✨ 💛 ✦', motion: 'burst', heroMotion: 'glow', bg1: '#fff9de', bg2: '#ffe5b2' },
  { id: 'confetti', name: 'Celebration confetti', category: 'Elegant', emoji: '🎊', particles: '🎉 🎊 ✨', motion: 'curtain', heroMotion: 'spin', bg1: '#f6edff', bg2: '#f6def1' },
  { id: 'snow-kiss', name: 'Snowy love', category: 'Elegant', emoji: '❄️', particles: '❄️ 🤍 ✧', motion: 'rain', heroMotion: 'spin', bg1: '#f4fcff', bg2: '#dbeaff' },
  { id: 'feather', name: 'Feather softness', category: 'Elegant', emoji: '🪶', particles: '🪶 🤍 ✨', motion: 'wave', heroMotion: 'bounce', bg1: '#fff8fa', bg2: '#e6e7f7' },
]);
const safeIntroStyle = style => INTRO_PRESETS.some(v => v.id === style) ? style : 'bouquet';
const DEFAULT_PAPER_MAGIC = Object.freeze({ typewriter: true, pageTurn: true, bouquetIntro: true, introStyle: 'bouquet', typingSpeed: 'classic' });
function safePaperMagic(raw) {
  const v = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    typewriter: v.typewriter === true,
    pageTurn: v.pageTurn === true,
    bouquetIntro: v.bouquetIntro === true,
    introStyle: safeIntroStyle(v.introStyle),
    typingSpeed: ['gentle', 'classic', 'quick'].includes(v.typingSpeed) ? v.typingSpeed : 'classic'
  };
}

const safeCoverText = value => typeof value === 'string' && value.trim()
  ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 64)
  : DEFAULT_COVER_TEXT;
function clean(d) {
  if (!d || !Array.isArray(d.pages) || !d.pages.length) return null;
  const signature = d.signature && typeof d.signature === 'object' ? d.signature : {};
  return {
    id: String(d.id || uid()).replace(/\W/g, '').slice(0, 30),
    title: String(d.title || 'A little surprise').slice(0, 80),
    from: String(d.from || '').slice(0, 40),
    coverText: safeCoverText(d.coverText),
    paperMagic: safePaperMagic(d.paperMagic),
    envelopeColor: hexOk(d.envelopeColor) ? d.envelopeColor : ENV[0],
    createdAt: String(d.createdAt || new Date().toISOString()).slice(0, 40),
    shortCode: safeCode(d.shortCode), customCode: safeCode(d.customCode),
    linkCodes: [...new Set([...(Array.isArray(d.linkCodes) ? d.linkCodes.slice(0, 50) : []), d.shortCode, d.customCode].map(safeCode).filter(Boolean))].slice(0, 50),
    signature: { text: String(signature.text || '').slice(0, 45), style: Number.isInteger(+signature.style) ? Math.max(0, Math.min(9, +signature.style)) : 0, align: ['left', 'center', 'right'].includes(signature.align) ? signature.align : 'right' },
    updatedAt: String(d.updatedAt || d.createdAt || new Date().toISOString()).slice(0, 40),
    pages: d.pages.slice(0, 10).map(p => ({
      text: String(p && p.text || '').slice(0, 600),
      color: hexOk(p && p.color) ? p.color : PAPER[0],
      photos: Array.isArray(p && p.photos) ? p.photos.slice(0, 4).map(safeImage).filter(Boolean) : [],
      effect: ['none', 'hearts', 'sparkles', 'flowers', 'stars', 'butterflies'].includes(p && p.effect) ? p.effect : 'none',
      photoStyle: safePhotoStyle(p && p.photoStyle),
      photoLayout: safePhotoLayout(p && p.photoLayout)
    }))
  };
}
let store = [], receivedStore = [], currentUser = null, accountKey = null;
let mailboxView = 'recent', editingId = null, premiumApproved = false, premiumState = null, premiumPayments = [];
let stopReceived = () => { }, stopSubscription = () => { };
let stopSupport = () => { }, stopFeedback = () => { }, supportInbox = {}, feedbackInbox = {};
const inquiryDate = ts => { const d = new Date(Number(ts)); return Number.isFinite(d.getTime()) ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date unknown'; };
function renderInquiryHistory(kind) {
  const support = kind === 'support';
  const target = $(support ? '#supportHistory' : '#feedbackHistory');
  const raw = support ? supportInbox : feedbackInbox;
  const items = Object.entries(raw || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (!items.length) { target.innerHTML = '<p class="inquiry-empty">Nothing here yet. Your submissions will appear here.</p>'; return; }
  target.innerHTML = items.slice(0, 40).map(item => `<article class="inquiry-entry"><div class="inquiry-entry-top"><strong>${esc(item.subject || item.topic || 'Message')}</strong><span class="inquiry-pill ${item.status === 'resolved' ? 'resolved' : ''}">${item.status === 'resolved' ? 'Resolved' : 'Open'}</span></div><small>${esc(inquiryDate(item.createdAt))}${support ? '' : ' · ' + esc(String(item.rating || 5)) + '/5 stars'}</small><p>${esc(item.message || '')}</p>${item.adminReply ? `<div class="inquiry-reply"><b>Reply from support</b><p>${esc(item.adminReply)}</p></div>` : ''}</article>`).join('');
}
function watchInquiries(uid) {
  stopSupport(); stopFeedback(); supportInbox = {}; feedbackInbox = {};
  renderInquiryHistory('support'); renderInquiryHistory('feedback');
  stopSupport = window.WENV_DB.subscribeInquiries('support', uid, data => { if (currentUser?.uid !== uid) return; supportInbox = data; renderInquiryHistory('support'); }, err => { $('#supportHistory').textContent = 'Could not load requests. Check Firebase rules.'; console.warn(err) });
  stopFeedback = window.WENV_DB.subscribeInquiries('feedback', uid, data => { if (currentUser?.uid !== uid) return; feedbackInbox = data; renderInquiryHistory('feedback'); }, err => { $('#feedbackHistory').textContent = 'Could not load feedback. Check Firebase rules.'; console.warn(err) });
}
function wireInquiryForm(kind) {
  const support = kind === 'support', form = $(support ? '#supportForm' : '#feedbackForm'), button = $(support ? '#supportSubmit' : '#feedbackSubmit'), status = $(support ? '#supportStatus' : '#feedbackStatus');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || !currentUser) return;
    const topic = $(support ? '#supportTopic' : '#feedbackTopic').value;
    const message = $(support ? '#supportMessage' : '#feedbackMessage').value.trim();
    const subject = support ? $('#supportSubject').value.trim() : '';
    if (message.length < 10 || message.length > (support ? 1500 : 1200) || (support && (subject.length < 3 || subject.length > 90))) { status.textContent = 'Please check your subject and message length.'; return; }
    const payload = { uid: currentUser.uid, email: String(currentUser.email || '').slice(0, 150), name: String(currentUser.displayName || 'User').slice(0, 80), topic, message, status: 'open', createdAt: Date.now() };
    if (support) payload.subject = subject; else payload.rating = Number($('#feedbackRating').value);
    button.disabled = true; button.textContent = 'Sending…'; status.textContent = 'Saving your message securely…';
    try { await window.WENV_DB.submitInquiry(kind, currentUser.uid, payload); form.reset(); status.textContent = '✓ Received! Your message is saved and visible to the admin.'; toast(support ? 'Support request submitted' : 'Feedback submitted'); }
    catch (err) { console.error('Inquiry save error:', err); status.textContent = 'Could not send. Check your connection and publish the new Firebase rules.'; }
    finally { button.disabled = false; button.textContent = support ? 'Send support request' : 'Submit feedback'; }
  });
}
wireInquiryForm('support'); wireInquiryForm('feedback');

const isPremium = () => premiumApproved === true && Number(premiumState?.expiresAt || 0) > Date.now();
const premiumRemaining = () => Math.max(0,Number(premiumState?.expiresAt || 0)-Date.now());
const premiumLeftText = ms => { const d=Math.floor(ms/86400000),h=Math.floor(ms%86400000/3600000),m=Math.floor(ms%3600000/60000); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; };
const pageLimit = () => isPremium() ? 10 : 8;
const photoLimit = () => isPremium() ? 4 : 2;
function updatePageOptions() {
  const old = Number($('#count').value) || 1;
  const max = Math.max(pageLimit(), editingId && store.find(e => e.id === editingId)?.pages.length || 0);
  $('#count').innerHTML = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1} page${i ? 's' : ''}</option>`).join('');
  $('#count').value = String(Math.min(old, max));
}
function editorCoverText() {
  if (isPremium()) return safeCoverText($('#coverText').value);
  if (editingId) {
    const original = store.find(e => e.id === editingId);
    return safeCoverText(original?.coverText);
  }
  return DEFAULT_COVER_TEXT;
}
function updateCoverEditorLock() {
  const field = $('#coverText');
  field.disabled = !isPremium();
  $('#coverUpgrade').hidden = isPremium();
  $('#coverPlanLabel').textContent = isPremium() ? '✦ Unlocked' : '🔒 Free default';
  $('#coverPlanLabel').classList.toggle('unlocked', isPremium());
  $('#coverTextNote').textContent = isPremium()
    ? 'Write a short greeting (up to 64 characters). It will appear in the preview and on shared envelopes.'
    : (editingId && store.find(e => e.id === editingId)?.coverText !== DEFAULT_COVER_TEXT)
      ? 'Original premium greeting is preserved while you edit on Free. Upgrade to change it.'
      : 'Free plan uses the original greeting. Subscribe to Premium to customize it.';
  updPreview();
}
function updatePaperMagicEditor() {
  const unlocked = isPremium();
  const source = editingId ? store.find(e => e.id === editingId)?.paperMagic : null;
  const show = unlocked ? safePaperMagic(paperMagic) : safePaperMagic(source || { typewriter: false, pageTurn: false, bouquetIntro: false });
  const type = $('#paperMagicTypewriter'), turn = $('#paperMagicTurn'), bouquet = $('#paperMagicBouquet');
  if (!type || !turn || !bouquet) return;
  type.checked = show.typewriter === true;
  turn.checked = show.pageTurn === true;
  bouquet.checked = show.bouquetIntro === true;
  type.disabled = turn.disabled = bouquet.disabled = !unlocked;
  $('#paperMagicSpeed').value = ['gentle', 'classic', 'quick'].includes(show.typingSpeed) ? show.typingSpeed : 'classic';
  $('#paperMagicSpeed').disabled = !unlocked || !type.checked;
  $('#paperMagicBadge').textContent = unlocked ? '✦ Premium unlocked' : '🔒 Premium';
  $('#paperMagicHelp').textContent = unlocked
    ? 'Saved with your envelope. Your recipient sees the typewriter, bouquet intro, and paper effects too, even without Premium.'
    : 'Unlock Premium to create or edit animated letters. Existing Premium animations are kept when editing.';
  $('#paperMagicUpgrade').hidden = unlocked;
  renderIntroChoices();
}
function updateSubscriptionUI() {
  $('#settingsPlanStatus').textContent = isPremium() ? 'Premium' : 'Free';
  $('#premiumPlanBtn').textContent = isPremium() ? '✓ Premium active' : '✦ Choose Maya or GoTyme';
  $('#premiumPlanBtn').disabled = isPremium();
  $('#freePlanBtn').textContent = isPremium() ? 'Premium account' : '✓ Current free plan';
  $('#freePlanBtn').disabled = true;
  $('#premiumPriceDisplay').innerHTML = Number(window.WENV_PAYMENT?.premiumPricePHP) > 0
    ? '₱' + Number(window.WENV_PAYMENT.premiumPricePHP).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' <small>· one-time manual approval</small>'
    : 'Set price <small>· in payment-config.js</small>';
  $('#premiumAccountStatus').textContent = isPremium() ? `✓ Premium active · ${premiumLeftText(premiumRemaining())} remaining · until ${new Date(premiumState.expiresAt).toLocaleString('en-PH')}`
    : premiumPayments.some(v => v.status === 'pending') ? '⏳ Payment reference submitted; awaiting manual verification.'
      : 'Free plan. Select a payment method to request Premium.';
  renderPaymentHistory(); updatePageOptions(); renderPages(); renderSignatureStyles(); renderColorPalettes(); updateCoverEditorLock(); updatePaperMagicEditor(); renderAccountDashboard();
}
function watchPremium(uid) {
  stopSubscription();
  stopSubscription = window.WENV_DB.subscribePremium(uid, data => {
    if (currentUser?.uid !== uid) return;
    premiumState = data || null;
    premiumApproved = !!(data && data.enabled === true);
    updateSubscriptionUI();
  }, err => console.warn('Premium status:', err));
}
let stopPayments = () => { };
function watchPayments(uid) {
  stopPayments();
  stopPayments = window.WENV_DB.subscribePayments(uid, data => {
    if (currentUser?.uid !== uid) return;
    premiumPayments = Object.entries(data || {}).map(([id, p]) => ({ ...p, id }))
      .sort((x, y) => Number(y.submittedAt || 0) - Number(x.submittedAt || 0));
    updateSubscriptionUI();
  }, err => console.warn('Payment requests:', err));
}
function renderPaymentHistory() {
  const target = $('#paymentRequestList'); if (!target) return;
  target.innerHTML = premiumPayments.slice(0, 5).map(p => `<div class="payment-request-item"><span>${p.method === 'maya' ? 'Maya' : 'GoTyme'} • ${esc(p.reference || '')}</span><b class="payment-state">${p.status === 'approved' ? '✓ Approved' : p.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}</b></div>`).join('');
}
const paymentMethods = { maya: { label: 'Maya (PayMaya)', logo: 'maya' }, gotyme: { label: 'GoTyme Bank', logo: 'gotyme' } };
const payLogo = method => `<img class="payment-brand-logo" src="${method === 'maya' ? PAYMENT_LOGOS.maya : PAYMENT_LOGOS.gotyme}" alt="${method === 'maya' ? 'Maya logo' : 'GoTyme Bank logo'}" loading="lazy" referrerpolicy="no-referrer">`;
const PAYMENT_LOGOS = { maya: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Maya_logo.svg/960px-Maya_logo.svg.png', gotyme: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/GoTyme_Bank_logo.svg/1280px-GoTyme_Bank_logo.svg.png' };
function paymentReady(method) {
  const cfg = window.WENV_PAYMENT || {}, dest = cfg[method] || {};
  return Number.isFinite(Number(cfg.premiumPricePHP)) && Number(cfg.premiumPricePHP) > 0 &&
    String(dest.accountName || '').trim().length > 1 && String(dest.accountNumber || '').trim().length >= 8;
}
function paymentPicker() {
  if (isPremium()) return toast('Your Premium plan is already active ♡');
  modal(`<div class="pay-dialog"><div class="mh"><h2>Choose your payment 💌</h2><button class="x" onclick="closeModal()" aria-label="Close">×</button></div><p class="pay-intro">Select a payment method. A transfer is reviewed by the website owner before Premium becomes active.</p><div class="pay-methods"><button class="pay-method" onclick="paymentDetails('maya')"><span class="pay-logo-wrap">${payLogo('maya')}</span><b>Maya</b><small>PayMaya wallet transfer</small></button><button class="pay-method" onclick="paymentDetails('gotyme')"><span class="pay-logo-wrap">${payLogo('gotyme')}</span><b>GoTyme</b><small>GoTyme Bank transfer</small></button></div><p class="pay-note">Never enter your PIN, OTP, or bank password on this website.</p></div>`);
}
function paymentDetails(method) {
  if (!paymentMethods[method]) return;
  const dest = window.WENV_PAYMENT?.[method] || {}, amount = Number(window.WENV_PAYMENT?.premiumPricePHP || 0);
  const ready = paymentReady(method);
  const amountText = amount > 0 ? '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Not configured';
  modal(`<div class="pay-dialog"><div class="mh"><h2>${payLogo(method)} ${paymentMethods[method].label}</h2><button class="x" onclick="closeModal()" aria-label="Close">×</button></div><div class="payment-step"><b>1. Review payment details</b><div class="payment-destination"><small>Premium price</small><strong>${esc(amountText)}</strong><small>Recipient name</small><strong>${esc(dest.accountName || 'Not yet configured')}</strong><small>Recipient ${method === 'maya' ? 'wallet number' : 'account number'}</small><div class="pay-copy-row"><strong>${esc(dest.accountNumber || 'Not yet configured')}</strong>${ready ? `<button class="btn sec" type="button" onclick="copyPaymentNumber('${method}')">Copy</button>` : ''}</div></div></div><div class="payment-step"><b>2. Send using your official ${paymentMethods[method].label} app</b><p>Check the recipient details and amount inside your banking app before sending money. Never pay if the destination is missing or unverified.</p></div><div class="payment-step"><b>3. Submit the transaction reference</b><label class="payment-reference-label">Transaction / receipt reference<input id="paymentReference" maxlength="64" autocomplete="off" placeholder="Enter the reference from your bank receipt" ${ready ? '' : 'disabled'} /></label><button class="btn pri wide" id="paymentSubmit" type="button" ${ready ? '' : 'disabled'}>Submit for manual verification</button><small class="pay-note">Submitting does not activate Premium or confirm payment.</small></div>${!ready ? '<p class="pay-config-warning">⚠️ Payments are not available yet. The site owner must set a real price and recipient details in js/payment-config.js.</p>' : ''}<button class="btn sec wide" onclick="paymentPicker()" type="button">← Change payment method</button></div>`);
  if (ready) $('#paymentSubmit').onclick = () => submitPaymentRequest(method);
}
function copyPaymentNumber(method) {
  const number = String(window.WENV_PAYMENT?.[method]?.accountNumber || '');
  if (!number) return;
  navigator.clipboard?.writeText(number).then(() => toast('Account number copied')).catch(() => toast('Select the number to copy'));
}
let sendingPayment = false;
async function submitPaymentRequest(method) {
  if (sendingPayment || !currentUser || !paymentReady(method) || isPremium()) return;
  const ref = $('#paymentReference')?.value?.trim() || '';
  if (!/^[A-Za-z0-9][A-Za-z0-9._\-\/ ]{5,63}$/.test(ref)) return toast('Enter a valid transaction reference (6–64 characters).');
  const amount = Number(window.WENV_PAYMENT.premiumPricePHP);
  const button = $('#paymentSubmit'); button.disabled = true; button.textContent = 'Submitting…'; sendingPayment = true;
  try {
    await window.WENV_DB.submitPayment(currentUser.uid, {
      uid: currentUser.uid, method, reference: ref, amount,
      status: 'pending', submittedAt: Date.now(), email: String(currentUser.email || '').slice(0, 100)
    });
    modal(`<div class="big">⏳</div><h2>Request received</h2><p>Your ${paymentMethods[method].label} reference is pending review. The owner will verify the transfer directly in the payment account before activating Premium. No access is granted yet.</p><button class="btn pri wide" onclick="closeModal()">Back to Subscription</button>`);
  } catch (err) { console.error(err); toast('Could not submit request. Check Firebase rules.'); button.disabled = false; button.textContent = 'Submit for manual verification'; }
  finally { sendingPayment = false; }
}
function recordReceived(key, e, code = '') {
  if (!currentUser || !e) return;
  if (store.some(m => m.id === e.id)) return; // your own letter, not a received letter
  if (code && receivedStore.some(m => m.senderUid && m.code === code)) return; // direct deliveries already live in this inbox
  const item = { title: e.title, from: e.from || '', createdAt: e.createdAt || '', receivedAt: new Date().toISOString(), code, envelope: code ? null : clean(e) };
  window.WENV_DB.saveReceived(currentUser.uid, key, item).catch(err => console.warn('Received history save:', err));
}
function watchReceived(uid) {
  stopReceived(); let initialSync = true, priorKeys = new Set();
  stopReceived = window.WENV_DB.subscribeReceived(uid, data => {
    if (currentUser?.uid !== uid) return;
    const incoming = Object.entries(data || {}).map(([key,item])=>({ ...item,key })).sort((a,b)=>String(b.receivedAt||'').localeCompare(String(a.receivedAt||'')));
    if (!initialSync && incoming.some(item=>(item.senderUid || item.anonymous) && !item.readAt && !priorKeys.has(item.key))) toast('💌 A new envelope has arrived!');
    initialSync = false; priorKeys = new Set(incoming.map(v=>v.key));
    receivedStore = incoming; renderDash();
  }, err => console.warn('Received collection sync:',err));
}

let cloudReady = false, stopCloud = () => { }, connectionUid = null, cloudConnected = false;
function cloudState(msg, status = 'loading') {
  $('#cloudStatus').textContent = msg;
  $('#cloudStatus').dataset.state = status;
}
function loadAccount(uid) {
  accountKey = 'wenvcute_envelopes_v2_' + uid;
  try {
    if (localStorage.getItem(accountKey) === null && localStorage.getItem(KEY) !== null) {
      const legacy = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(legacy)) localStorage.setItem(accountKey, JSON.stringify(legacy.map(clean).filter(Boolean)));
      localStorage.removeItem(KEY);
    }
    const data = JSON.parse(localStorage.getItem(accountKey) || '[]');
    store = Array.isArray(data) ? data.slice(0, 500).map(clean).filter(Boolean) : [];
  } catch { store = [] }
}
async function watchCloud(uid) {
  stopCloud(); stopCloud = () => { }; cloudReady = false;
  cloudState('⏳ Syncing envelopes...');
  const legacy = store.slice();
  let first = true;
  stopCloud = window.WENV_DB.subscribe(uid, async remote => {
    if (!currentUser || currentUser.uid !== uid) return;
    const online = Object.values(remote || {}).map(clean).filter(Boolean).sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
    store = online; cloudReady = true; cloudConnected = true;
    cloudState('All envelopes synced to your Google account', 'ok'); renderDash();
    if (first) {
      first = false;
      const existing = new Set(online.map(e => e.id));
      const missing = legacy.filter(e => !existing.has(e.id));
      if (missing.length) {
        cloudState(`⏳ Importing ${missing.length} previously saved envelopes...`);
        let errors = 0;
        for (const e of missing) {
          if (!currentUser || currentUser.uid !== uid) return;
          try { await window.WENV_DB.put(uid, e) } catch (err) { errors++; console.error(err) }
        }
        if (errors) { cloudState(`${errors} old envelopes failed to upload. Check your database rules.`, 'error'); return }
      }
      // Prevent deleted envelopes from reappearing on the next login.
      try { localStorage.removeItem(accountKey) } catch { }
      cloudState('All envelopes synced to your Google account', 'ok');
    }
  }, err => {
    if (!currentUser || currentUser.uid !== uid) return;
    cloudReady = false; cloudConnected = false;
    cloudState('⚠️ Cloud sync unavailable. Check Firebase Database rules / connection.', 'error');
    console.error('Realtime Database sync:', err);
    toast('Cloud sync failed. Envelopes cannot be saved until connected.');
  });
}
async function cloudPut(e) {
  if (!currentUser || !cloudReady) throw Error('Cloud not ready');
  await window.WENV_DB.put(currentUser.uid, clean(e));
}
async function cloudRemove(id) {
  if (!currentUser || !cloudReady) throw Error('Cloud not ready');
  await window.WENV_DB.remove(currentUser.uid, id);
}
let signatureStyle = 0, signatureAlign = 'right', photoBusy = false;
let paperMagic = { ...DEFAULT_PAPER_MAGIC };


let envColor = ENV[0], paper = PAPER[0], pages, recv = null, idx = 0, preview = false, created = null, tt;
const blank = () => Array.from({ length: 10 }, () => ({ text: '', color: paper, photos: [], effect: 'none', photoStyle: 'classic', photoLayout: 'stack' })); pages = blank();

/* v9 mobile creator: persistent canvas + fixed bottom tool rail + collapsible controls.
   All fields remain the SAME live DOM inputs; switching tools never loses an edit. */
const STUDIO_TOOLS = [
  { id: 'title', name: 'Title', icon: '✎', heading: 'Envelope title', hint: 'Name the envelope they will open.' },
  { id: 'from', name: 'From', icon: '♡', heading: 'From', hint: 'Let them know who sent this letter.' },
  { id: 'pages', name: 'Pages', icon: '▣', heading: 'Number of pages', hint: 'Choose how many pages are in this envelope.' },
  { id: 'envelope', name: 'Envelope', icon: '✉', heading: 'Envelope colors', hint: 'Pick the color of the envelope.' },
  { id: 'paper', name: 'Paper', icon: '▤', heading: 'Paper colors', hint: 'Choose a paper shade for all pages or just this page.' },
  { id: 'greeting', name: 'Greeting', icon: '❀', heading: 'Envelope greeting', hint: 'Customize the message shown on the sheets.' },
  { id: 'write', name: 'Write', icon: '☷', heading: 'Write the letter', hint: 'Type a message on each page.' },
  { id: 'photos', name: 'Photos', icon: '▧', heading: 'Add your pictures', hint: 'Add pictures and arrange them on your page.' },
  { id: 'borders', name: 'Borders', icon: '▢', heading: 'Photo borders', hint: 'Choose a border style for the pictures.' },
  { id: 'layouts', name: 'Layouts', icon: '◈', heading: 'Photo layouts', hint: 'Arrange your pictures into a sweet composition.' },
  { id: 'effects', name: 'Effects', icon: '✦', heading: 'Page effects', hint: 'Choose the decorative animation for this paper.' },
  { id: 'magic', name: 'Magic', icon: '💐', heading: 'Paper magic', hint: 'Typewriter, page flipping and bouquet intro.' },
  { id: 'signature', name: 'Sign', icon: '❣', heading: 'Signature', hint: 'Add a lovely personal sign-off.' },
  { id: 'seal', name: 'Seal', icon: '✓', heading: 'Seal and save', hint: 'Review your letter and save it to your account.' }
];
let studioTool = 'title', studioCollapsed = (() => { try { return sessionStorage.getItem('wenv-mobile-studio-closed') === '1' } catch { return false } })();
let introCategory = 'All';
const createWizardMobile = () => matchMedia('(max-width: 860px)').matches;
const studioPageTools = new Set(['paper', 'write', 'photos', 'borders', 'layouts', 'effects']);
function buildStudioRail() {
  const rail = $('#studioToolRail');
  if (rail.children.length) return;
  rail.innerHTML = STUDIO_TOOLS.map(tool => `<button type="button" class="studio-tool" data-studio-switch="${tool.id}" aria-label="${tool.heading}" title="${tool.heading}"><span class="studio-tool-icon" aria-hidden="true">${tool.icon}</span><span>${tool.name}</span></button>`).join('');
  rail.querySelectorAll('[data-studio-switch]').forEach(btn => btn.addEventListener('click', () => selectStudioTool(btn.dataset.studioSwitch)));
}
function updateStudioCanvas() {
  const canvas = $('#studioPaperCanvas');
  if (!canvas) return;
  const paperMode = studioPageTools.has(studioTool);
  const magicMode = studioTool === 'magic';
  canvas.hidden = !paperMode;
  $('#studioIntroCanvas').hidden = !magicMode;
  const pvScene = $('#create .pv > .scene');
  if (pvScene) pvScene.hidden = paperMode || magicMode;
  const previewText = $('#studioPaperWriting');
  const active = pages[activeLetterPage] || pages[0];
  if (previewText) previewText.textContent = active?.text?.trim() || 'Your sweet message will appear here ♡';
  const sheet = canvas.querySelector('.studio-paper-sheet');
  if (sheet) sheet.style.background = active?.color || '#fffaf2';
  $('#studioPaperBadge').textContent = `Page ${activeLetterPage + 1} of ${n()}`;
  const photosEl = $('#studioPaperPictures');
  const photoDesignMode=studioTool==='borders'||studioTool==='layouts';
  canvas.classList.toggle('studio-photo-preview-mode',photoDesignMode);
  if (photosEl) {
    const sources=(active?.photos||[]).filter(safeImage);
    if (photoDesignMode) {
      const photos=Array.from({length:3},(_,i)=>sources.length?sources[i%sources.length]:'assets/photo-preview-sample.jpg');
      const key=[activeLetterPage,active?.photoStyle,active?.photoLayout,photos.join('|')].join(':');
      if(photosEl.dataset.previewKey!==key) {
        photosEl.dataset.previewKey=key;
        photosEl.innerHTML=Array.from({length:Math.min(3,Math.max(1,photos.length))},(_,i)=>{
          const [x,y,r]=photoCoordinates(active.photoLayout,i,Math.min(3,Math.max(1,photos.length)));
          return `<div class="studio-photo-preview-card photo-variant--${safePhotoStyle(active.photoStyle)}" style="left:calc(50% + ${Math.max(-110,Math.min(110,Math.round(x*.75)))}px);top:${Math.max(2,Math.min(68,Math.round(y*.47)))}px;transform:translateX(-50%) rotate(${r}deg);z-index:${i+1}"><span class="polaroid-mini-frame"><span class="polaroid-mini-picture" style="background-image:url('${photos[i%photos.length]}')"></span></span></div>`;
        }).join('');
      }
    } else {
      photosEl.dataset.previewKey='';
      if (photosEl.children.length !== sources.length || sources.some((src, i) => photosEl.children[i]?.getAttribute('src') !== src)) {
        photosEl.replaceChildren(...sources.map((src,i)=>{const img=document.createElement('img');img.src=src;img.alt=`Photo ${i+1}`;img.loading='lazy';return img;}));
      }
    }
  }
  $('#studioPreviewCaption').textContent = magicMode ? 'Watch every animation live as you choose ♡' : paperMode ? 'Live paper preview · changes appear above ♡' : 'Live envelope preview ♡';
  if (magicMode) renderStudioIntroPreview();
  $('#studioSealDetails').textContent = `${$('#title').value.trim() || 'Untitled envelope'} · ${n()} page${n() === 1 ? '' : 's'} · From ${$('#from').value.trim() || 'Someone special'}`;
}
function updateStudioTool() {
  const item = STUDIO_TOOLS.find(t => t.id === studioTool) || STUDIO_TOOLS[0];
  document.body.dataset.studioTool = item.id;
  const i = STUDIO_TOOLS.indexOf(item);
  const mobile = createWizardMobile();
  const sheet = $('#editorWorkbench');
  const dock = $('#studioBottomDock');
  $('#createWizard').hidden = true;
  $('#createMobileNav').hidden = true;
  $$('.editor-step-block').forEach(block => block.hidden = false);
  dock.hidden = false;
  $('#studioPanelHead').hidden = false;
  $('#studioPanelFooter').hidden = false;
  sheet.classList.toggle('studio-is-collapsed', mobile && studioCollapsed);
  document.body.classList.toggle('studio-drawer-closed', mobile && studioCollapsed);
  $('#studioDrawerReopen').setAttribute('aria-expanded', String(mobile && !studioCollapsed));
  $('#studioPanelCollapse').setAttribute('aria-expanded', String(!studioCollapsed));
  $('#studioPanelCollapse').textContent = studioCollapsed ? '⌃' : '⌄';
  $('#studioToolTitle').textContent = item.heading;
  $('#studioToolDesc').textContent = item.hint;
  $('#studioBack').disabled = i === 0;
  $('#studioNext').textContent = i === STUDIO_TOOLS.length - 1 ? '💌 Seal now' : i === STUDIO_TOOLS.length - 2 ? 'Review ›' : 'Next ›';
  $$('#studioToolRail .studio-tool').forEach(btn => {
    const active = btn.dataset.studioSwitch === item.id;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'step' : 'false');
  });
  updateStudioCanvas();
  renderMobilePhotoPicker();
}
function selectStudioTool(id) {
  if (!STUDIO_TOOLS.some(t => t.id === id)) return;
  if(studioTool!==id) mobilePickerDismissed=false;
  studioTool = id; // Tool changes preserve closed state unless user opens the drawer.
  // Borders/Layouts are a photo-first mode: auto-hide the glass sheet and keep a swipeable strip outside it.
  if (createWizardMobile() && (id === 'borders' || id === 'layouts')) {
    studioCollapsed = true;
    try { sessionStorage.setItem('wenv-mobile-studio-closed','1') } catch {}
  }
  $('#editorWorkbench').style.removeProperty('--studio-drag-y');
  updateStudioTool();
  const panel = $('#studioPanelScroll');
  if (panel) panel.scrollTop = 0;
  const chosen = $(`#studioToolRail [data-studio-switch="${id}"]`);
  if (chosen) chosen.scrollIntoView({ block: 'nearest', inline: 'center', behavior: calm ? 'auto' : 'smooth' });
}
// The mobile photo rail lives OUTSIDE .editor-workbench; drawer collapse cannot hide it.
let mobilePickerSignature = '';
let mobilePickerDismissed = false;
let mobilePickerGesture = null;
const photoThumbnail = () => (pages[activeLetterPage]?.photos || []).find(safeImage) || 'assets/photo-preview-sample.jpg';
function mobilePhotoSample(i=0) {
  const actual=(pages[activeLetterPage]?.photos || []).filter(safeImage);
  return actual.length ? actual[i % actual.length] : 'assets/photo-preview-sample.jpg';
}
function mobilePhotoOptionsMarkup(type) {
  const p=pages[activeLetterPage] || pages[0];
  if (type==='borders') return PHOTO_STYLES.map((v,i)=>{
    const selected=p.photoStyle===v.id, locked=!isPremium() && i>0;
    return `<button type="button" class="mobile-photo-choice photo-variant--${v.id}${selected?' on':''}${locked?' is-locked':''}" data-mobile-photo-style="${v.id}" aria-pressed="${selected}" aria-label="${esc(v.name)}${locked?' Premium required':''}"><span class="mobile-choice-frame polaroid-mini-frame"><span class="mobile-choice-picture polaroid-mini-picture" style="background-image:url('${mobilePhotoSample(i)}')"></span></span>${locked?'<span class="mobile-choice-lock" aria-hidden="true">🔒 Premium</span>':''}<span class="mobile-choice-name">${locked?'🔒 ':''}${esc(v.name)}</span></button>`;
  }).join('');
  return PHOTO_LAYOUTS.map((v,i)=>{
    const selected=p.photoLayout===v.id, locked=!isPremium() && i>0;
    const preview=[0,1,2].map(k=>{
      const [x,y,r]=photoCoordinates(v.id,k,3);
      return `<i style="left:calc(50% + ${Math.max(-63,Math.min(63,Math.round(x*.60)))}px);top:${Math.max(3,Math.min(34,Math.round(y*.26)))}px;transform:translateX(-50%) rotate(${r}deg);z-index:${k+1};background-image:url('${mobilePhotoSample(k)}')"></i>`;
    }).join('');
    return `<button type="button" class="mobile-photo-choice mobile-layout-choice${selected?' on':''}${locked?' is-locked':''}" data-mobile-photo-layout="${v.id}" aria-pressed="${selected}" aria-label="${esc(v.name)}${locked?' Premium required':''}"><span class="mobile-choice-layout">${preview}</span>${locked?'<span class="mobile-choice-lock" aria-hidden="true">🔒 Premium</span>':''}<span class="mobile-choice-name">${locked?'🔒 ':''}${esc(v.name)}</span></button>`;
  }).join('');
}
function renderMobilePhotoPicker() {
  const picker=$('#mobilePhotoPicker'), rail=$('#mobilePhotoPickerRail');
  if (!picker || !rail) return;
  const mode=createWizardMobile() && studioCollapsed && (studioTool==='borders'||studioTool==='layouts');
  picker.hidden=!mode;
  const showPicker=$('#mobilePhotoPickerShow');
  if (!mode) {mobilePickerSignature='';mobilePickerDismissed=false;if(showPicker)showPicker.hidden=true;return;}
  picker.classList.toggle('is-picker-dismissed',mobilePickerDismissed);
  if(showPicker){showPicker.hidden=!mobilePickerDismissed;showPicker.setAttribute('aria-expanded',String(!mobilePickerDismissed));}
  const count=n();
  const pageNav=$('#mobilePhotoPageNav');
  pageNav.hidden=count<=1;
  $('#mobilePhotoPageLabel').textContent=`Page ${activeLetterPage+1} of ${count}`;
  $('#mobilePhotoPagePrevious').disabled=activeLetterPage===0;
  $('#mobilePhotoPageNext').disabled=activeLetterPage>=count-1;
  const border=studioTool==='borders';
  $('#mobilePhotoPickerTitle').textContent=border?'Choose a border':'Choose a photo layout';
  $('#mobilePhotoPickerHint').textContent='← Swipe styles · Tap to apply · Pull down to hide';
  $('#mobilePhotoPickerCount').textContent=(border?PHOTO_STYLES:PHOTO_LAYOUTS).length+' styles';
  const p=pages[activeLetterPage]||pages[0];
  const sig=`${studioTool}:${activeLetterPage}:${isPremium()}:${p.photos?.join('|')||''}`;
  if(sig!==mobilePickerSignature){
    const oldX=rail.scrollLeft;
    rail.innerHTML=mobilePhotoOptionsMarkup(studioTool);
    rail.scrollLeft=mobilePickerSignature?.startsWith(studioTool+':')?oldX:0;
    mobilePickerSignature=sig;
  }
  const current=border?p.photoStyle:p.photoLayout;
  rail.querySelectorAll('button').forEach(btn=>{
    const on=(btn.dataset.mobilePhotoStyle||btn.dataset.mobilePhotoLayout)===current;
    btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',String(on));
  });
}
// Page arrows only show for an envelope with more than one letter page.
$('#mobilePhotoPagePrevious').addEventListener('click',()=>selectLetterPage(activeLetterPage-1));
$('#mobilePhotoPageNext').addEventListener('click',()=>selectLetterPage(activeLetterPage+1));
function setMobilePickerDismissed(value){
  mobilePickerDismissed=Boolean(value);
  renderMobilePhotoPicker();
}
$('#mobilePhotoPickerHide').addEventListener('click',()=>setMobilePickerDismissed(true));
$('#mobilePhotoPickerShow').addEventListener('click',()=>setMobilePickerDismissed(false));
// Swipe down to hide the independent picker; keep sideways swiping styles intact.
const mobilePickerEl=$('#mobilePhotoPicker');
mobilePickerEl.addEventListener('touchstart',e=>{
  if(e.touches.length!==1 || e.target.closest('.mobile-photo-page-nav,.mobile-picker-hide'))return;
  mobilePickerGesture={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
mobilePickerEl.addEventListener('touchend',e=>{
  if(!mobilePickerGesture)return;
  const dy=e.changedTouches[0].clientY-mobilePickerGesture.y;
  const dx=e.changedTouches[0].clientX-mobilePickerGesture.x;
  mobilePickerGesture=null;
  if(dy>54 && Math.abs(dy)>Math.abs(dx)*1.25)setMobilePickerDismissed(true);
},{passive:true});
mobilePickerEl.addEventListener('touchcancel',()=>{mobilePickerGesture=null;},{passive:true});
let pickerShowStart=null;
$('#mobilePhotoPickerShow').addEventListener('touchstart',e=>{pickerShowStart=e.touches[0]?.clientY??null;},{passive:true});
$('#mobilePhotoPickerShow').addEventListener('touchend',e=>{
  if(pickerShowStart!==null && pickerShowStart-e.changedTouches[0].clientY>25)setMobilePickerDismissed(false);
  pickerShowStart=null;
},{passive:true});
$('#mobilePhotoPickerRail').addEventListener('click',e=>{
  const card=e.target.closest('[data-mobile-photo-style],[data-mobile-photo-layout]');
  if (!card || !createWizardMobile()) return;
  const p=pages[activeLetterPage]; if(!p)return;
  const id=card.dataset.mobilePhotoStyle || card.dataset.mobilePhotoLayout;
  const border=Boolean(card.dataset.mobilePhotoStyle);
  if(!isPremium() && id!==(border?'classic':'stack'))return lockedDesignNotice();
  if(border) p.photoStyle=safePhotoStyle(id); else p.photoLayout=safePhotoLayout(id);
  studioCollapsed=true; // Choosing another thumbnail must not reopen the bottom sheet.
  try { sessionStorage.setItem('wenv-mobile-studio-closed','1') } catch {}
  updateStudioTool();
  // Keep user's horizontal scroll position and show live selection on the canvas.
  toast(border?'Photo border applied ♡':'Photo layout applied ♡');
});
function studioMove(dir) {
  const i = STUDIO_TOOLS.findIndex(t => t.id === studioTool);
  if (dir > 0 && i === STUDIO_TOOLS.length - 1) {
    $('#make').click();
    return;
  }
  selectStudioTool(STUDIO_TOOLS[Math.max(0, Math.min(STUDIO_TOOLS.length - 1, i + dir))].id);
}
function applyCreateWizard() {
  const mobile = createWizardMobile();
  document.body.classList.toggle('create-mobile-mode', mobile);
  buildStudioRail();
  updateStudioTool();
}

// Canva-like editor: keep only the selected tool. No completion dots or status clutter.
function renderStudioIntroPreview(styleOverride = null) {
  const preset = INTRO_PRESETS.find(v => v.id === safeIntroStyle(styleOverride || paperMagic.introStyle)) || INTRO_PRESETS[0];
  const targets = [$('#studioIntroScene'), $('#introInlineDemo')];
  for (const el of targets) {
    if (!el) continue;
    el.style.setProperty('--intro-bg1', preset.bg1 || '#fff0f7');
    el.style.setProperty('--intro-bg2', preset.bg2 || '#eadffa');
    el.dataset.motion = preset.motion || 'float';
    el.dataset.heroMotion = preset.heroMotion || 'pulse';
    const particleSet = (preset.particles || '🌸 ✨ ♡').split(' ');
    const particles = Array.from({ length: 20 }, (_, i) => {
      const angle = i * 2.39996323;
      const radius = 12 + Math.sqrt(i / 20) * 42;
      const x = Math.max(5, Math.min(95, 50 + Math.cos(angle) * radius));
      const y = Math.max(6, Math.min(94, 50 + Math.sin(angle) * radius));
      return `<span class="studio-intro-particle" style="--px:${x}%;--py:${y}%;--dx:${Math.round(Math.cos(angle) * 70)}px;--dy:${Math.round(Math.sin(angle) * 70)}px;--pd:-${(i % 8) * .22}s">${particleSet[i % particleSet.length]}</span>`;
    }).join('');
    el.innerHTML = `${particles}<div class="studio-intro-hero ${preset.id === 'giant-heart' ? 'giant-heart-preview' : ''}">${preset.id === 'giant-heart' ? '♥' : preset.emoji}</div><div class="studio-intro-name">${preset.name}</div>`;
  }
  $('#studioIntroLabel').textContent = `${preset.name} · Live preview`;
  const speed = safePaperMagic(paperMagic);
  $('#studioMotionSamples').hidden = !speed.typewriter && !speed.pageTurn;
  $('#studioMiniTypewriter').hidden = !speed.typewriter;
  $('#studioMiniPage').hidden = !speed.pageTurn;
  $('#studioMiniTypewriter').style.animationDuration = ({ gentle: '4.2s', classic: '2.7s', quick: '1.5s' })[speed.typingSpeed];
}
function previewIntroSelection(style, fullScreen = false) {
  if (fullScreen) return playBouquetIntro({ ...safePaperMagic(paperMagic), introStyle: style, bouquetIntro: true }, true);
  renderStudioIntroPreview(style);
}
function renderIntroChoices() {
  const categories = ['All', 'Flowers', 'Hearts', 'Magic', 'Cute', 'Elegant'];
  const catRail = $('#introCategories'), grid = $('#introChoices');
  if (!catRail || !grid) return;
  catRail.innerHTML = categories.map(cat => `<button type="button" data-intro-filter="${cat}" class="${cat === introCategory ? 'active' : ''}" aria-pressed="${cat === introCategory}">${cat}</button>`).join('');
  const setting = safePaperMagic(paperMagic);
  const list = introCategory === 'All' ? INTRO_PRESETS : INTRO_PRESETS.filter(i => i.category === introCategory);
  grid.innerHTML = list.map(item => `<button type="button" class="intro-card" data-intro-choice="${item.id}" aria-pressed="${item.id === setting.introStyle}" ><span class="intro-card-emoji">${item.emoji}</span><span class="intro-card-name">${item.name}</span><span class="intro-card-category">${item.category}</span></button>`).join('');
  $('#introStudio').classList.toggle('intro-locked', !isPremium());
  $('#introPreview').disabled = false; // Demo is viewable without buying; saving remains Premium-gated.
  $('#introCurrent').textContent = `${INTRO_PRESETS.find(p => p.id === setting.introStyle)?.name || 'Bouquet reveal'}${isPremium() ? ' · Selected' : ' · Premium preview'}`;
  renderStudioIntroPreview();
  catRail.querySelectorAll('[data-intro-filter]').forEach(button => button.onclick = () => { introCategory = button.dataset.introFilter; renderIntroChoices(); });
  grid.querySelectorAll('[data-intro-choice]').forEach(button => {
    button.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') previewIntroSelection(button.dataset.introChoice); });
    button.addEventListener('focus', () => previewIntroSelection(button.dataset.introChoice));
    button.addEventListener('pointerleave', () => previewIntroSelection(paperMagic.introStyle));
    button.addEventListener('blur', () => previewIntroSelection(paperMagic.introStyle));
  });
  grid.querySelectorAll('[data-intro-choice]').forEach(button => button.onclick = () => {
    previewIntroSelection(button.dataset.introChoice);
    if (!isPremium()) return;
    paperMagic.introStyle = safeIntroStyle(button.dataset.introChoice);
    renderIntroChoices();
    previewIntroSelection(paperMagic.introStyle);
  });
}
/* envelope component */
const sheets = (cols, coverText = DEFAULT_COVER_TEXT) => cols.slice(0, 5).map((p, i) => `<div class="sht" style="--p:${p};--i:${i};--r:${ROT[i]}deg"><b>${esc(safeCoverText(coverText))}</b></div>`).join('');
const envHTML = (c, cols, o = {}) => `<div class="env${o.float ? " float" : ""}" ${o.id ? `id="${o.id}"` : ""} ${o.play ? "data-play" : ""} style="${vars(c)}"><div class="eb"></div><div class="sh">${sheets(cols, o.coverText)}</div><div class="fr"><i class="pb"></i><i class="pl"></i><i class="pr"></i></div><div class="fl"></div>${o.play ? '<button class="seal" aria-label="Open envelope">♡</button>' : '<span class="seal">♡</span>'}</div>`;

/* nav */
function go(n) {
  if (!currentUser && n !== 'recv' && n !== 'ask' && !(n === 'create' && window.WENV_ANON?.composing)) {
    document.body.classList.remove('guest-receiving');
    $('#authGate').hidden = false;
    authStatus('Continue with Google to create your own envelope.');
    return;
  }
  if (n !== 'recv' && recv) clearPaperTurn();
  $$(".screen").forEach(s => s.classList.toggle("on", s.id === n)); $$(".tab").forEach(t => t.classList.toggle("on", t.dataset.go === n));
  document.body.classList.toggle("receiving", n === "recv"); scrollTo({ top: 0, behavior: calm || document.body.classList.contains("reduce-motion") ? "auto" : "smooth" }); if (n === "dash") renderDash(); if (n === "create") applyCreateWizard()
}
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2800) }
function modal(h) { $("#mc").innerHTML = h; $("#modal").classList.add("show"); setTimeout(() => { const f = $("#mc .btn,#mc input"); f && f.focus() }, 60) }
const closeModal = () => $("#modal").classList.remove("show");
function burst(el, n = 14) {
  if (!appearance.hearts || appearance.reduceMotion) return;
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }, S = ["♡", "♥", "💗", "💖", "✦", "✧"];
  for (let i = 0; i < n; i++) {
    const h = document.createElement("i"); h.className = "fx"; h.textContent = S[i % S.length];
    h.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;font-size:${16 + Math.random() * 14}px;--dx:${Math.random() * 260 - 130}px;--dy:${-90 - Math.random() * 230}px;--s:${.8 + Math.random()};animation-delay:${i * 45}ms`;
    document.body.append(h); setTimeout(() => h.remove(), 2800 + i * 45)
  }
}

/* create */
function swatches(el, list, cur, fn) {
  if (!el) return;
  const unique = [...new Set(list)];
  el.innerHTML = unique.map((c, i) => `<button type="button" class="dot${c === cur ? " on" : ""}" style="background:${c}" aria-label="Color ${i + 1}: ${c}" title="${c.toUpperCase()}" aria-pressed="${c === cur}" data-color="${c}"></button>`).join("");
  [...el.children].forEach((b, i) => b.onclick = () => {
    [...el.children].forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false') });
    b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); fn(unique[i]);
  });
}
function availableColors(kind, current) {
  const list = isPremium() ? fullColors(kind) : [...(kind === 'envelope' ? ENV : PAPER)];
  // Editing a formerly Premium envelope on Free must not silently discard its saved color.
  if (hexOk(current) && !list.includes(current)) list.push(current);
  return list;
}
function renderColorPalettes() {
  const envelopeList = availableColors('envelope', envColor), paperList = availableColors('paper', pages[0]?.color || paper);
  swatches($('#envSw'), envelopeList, envColor, c => { envColor = c; updPreview(); });
  swatches($('#paperSw'), paperList, pages[0]?.color || paper, c => { paper = c; pages.forEach(p => p.color = c); renderPages(); updPreview(); });
  $('#envColorCount').textContent = isPremium() ? `${envelopeList.length} Premium colors · scroll ↓` : `${ENV.length} free colors · ✦ Premium unlocks ${fullColors('envelope').length}`;
  $('#paperColorCount').textContent = isPremium() ? `${paperList.length} Premium colors · scroll ↓` : `${PAPER.length} free colors · ✦ Premium unlocks ${fullColors('paper').length}`;
  $('#envSw').classList.toggle('palette-premium', isPremium());
  $('#paperSw').classList.toggle('palette-premium', isPremium());
}
const n = () => +$("#count").value;
// These tabs switch the *editor*, never the stored page data. All page drafts
// remain in `pages[]` even when another tab is displayed or a page count changes.
let activeLetterPage = 0;
function pageTabHasContent(i) {
  return Boolean((pages[i]?.text || '').trim() || (pages[i]?.photos || []).length || (pages[i]?.effect && pages[i].effect !== 'none'));
}
function refreshPageTabMarkers() {
  $$('#letterPageTabs [data-letter-page]').forEach(b => {
    b.classList.toggle('has-content', pageTabHasContent(+b.dataset.letterPage));
  });
}
function updatePageTabArrows() {
  const rail = $('#letterPageTabs');
  if (!rail || !rail.classList.contains('is-scrollable')) return;
  $('#letterPageLeft').disabled = rail.scrollLeft < 3;
  $('#letterPageRight').disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3;
}
function renderPageTabs() {
  const count = n();
  const rail = $('#letterPageTabs');
  const priorScroll = rail.scrollLeft;
  const scrollable = count >= 5;
  activeLetterPage = Math.min(Math.max(activeLetterPage, 0), count - 1);
  $('#letterPageCount').textContent = `Page ${activeLetterPage + 1} of ${count}`;
  $('#letterPageHint').textContent = scrollable
    ? ''
    : '';
  rail.classList.toggle('is-scrollable', scrollable);
  $('#letterPageLeft').hidden = $('#letterPageRight').hidden = !scrollable;
  rail.innerHTML = pages.slice(0, count).map((p, i) =>
    `<button type="button" class="letter-page-tab${pageTabHasContent(i) ? ' has-content' : ''}" role="tab" id="letterPageTab${i}" data-letter-page="${i}" aria-controls="letterPagePanel" aria-selected="${i === activeLetterPage}" tabindex="${i === activeLetterPage ? 0 : -1}">Page ${i + 1}</button>`
  ).join('');
  rail.scrollLeft = scrollable ? priorScroll : 0;
  rail.querySelectorAll('[data-letter-page]').forEach(btn => {
    btn.onclick = () => selectLetterPage(+btn.dataset.letterPage);
    btn.onkeydown = e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const nextIndex = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1
        : Math.max(0, Math.min(count - 1, activeLetterPage + (e.key === 'ArrowRight' ? 1 : -1)));
      selectLetterPage(nextIndex);
      $('#letterPageTab' + nextIndex)?.focus({ preventScroll: true });
    };
  });
  requestAnimationFrame(() => {
    if (!scrollable) return;
    const active = $('#letterPageTab' + activeLetterPage);
    if (!active) return;
    const left = active.getBoundingClientRect().left - rail.getBoundingClientRect().left;
    rail.scrollBy({
      left: left - (rail.clientWidth - active.clientWidth) / 2,
      behavior: calm || document.body.classList.contains('reduce-motion') ? 'instant' : 'smooth'
    });
    updatePageTabArrows();
  });
  updatePageTabArrows();
}
function selectLetterPage(pageIndex) {
  if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= n() || pageIndex === activeLetterPage) return;
  activeLetterPage = pageIndex;
  renderPages();
}
function updPreview() { const e = $("#pvEnv .env"); if (e) { e.style.cssText = vars(envColor); e.querySelector(".sh").innerHTML = sheets(pages.slice(0, n()).map(p => p.color), editorCoverText()); } $("#pvTitle").textContent = $("#title").value.trim() || "Your envelope"; updateStudioCanvas(); }
function renderSignatureStyles() {
  const text = $('#signatureText').value.trim() || 'With love ♡';
  const rail = $('#signatureStyles'), previousScroll = rail.scrollLeft, previousTop = rail.scrollTop;
  rail.innerHTML = SIGNATURE_STYLES.map((style, i) => `<button type="button" role="tab" class="sig-style${i === signatureStyle ? ' on' : ''}" data-signature="${i}" aria-selected="${i === signatureStyle}" aria-label="${style.name} signature" tabindex="${i === signatureStyle ? '0' : '-1'}"><b style="font-family:${style.font}">Aa</b><small>${style.name}</small></button>`).join('');
  rail.scrollLeft = previousScroll; rail.scrollTop = previousTop;
  const preview = $('#signaturePreview'); preview.textContent = text;
  preview.style.fontFamily = SIGNATURE_STYLES[signatureStyle].font;
  preview.style.fontStyle = signatureStyle === 9 ? 'italic' : 'normal';
  updateSignaturePosition();
  rail.querySelectorAll('[data-signature]').forEach(b => b.onclick = () => {
    signatureStyle = Number(b.dataset.signature); renderSignatureStyles();
    rail.querySelector(`[data-signature="${signatureStyle}"]`)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
  });
  updateSignatureArrows();
}
function updateSignaturePosition() {
  const original = editingId && store.find(e => e.id === editingId);
  const showAlign = isPremium() ? signatureAlign : (original?.signature?.align || 'right');
  $('#signaturePreview').style.textAlign = showAlign;
  $('#sigAlignHint').textContent = isPremium() ? '✦ Premium positions unlocked' : '🔒 Free uses right alignment';
  $$('[data-align]').forEach(button => {
    const position = button.dataset.align, locked = !isPremium() && position !== 'right';
    button.classList.toggle('active', position === showAlign);
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-pressed', String(position === showAlign));
    button.setAttribute('aria-disabled', String(locked));
    const lock = button.querySelector('.sig-lock'); if (lock) lock.hidden = !locked;
  });
}
document.querySelectorAll('[data-align]').forEach(button => button.onclick = () => {
  const position = button.dataset.align;
  if (!isPremium() && position !== 'right') {
    modal(`<div class="big">🔒</div><h2>Signature positions</h2><p>Left and Center signatures are included with Premium. On Free, the signature stays on the right.</p><div class="row"><button class="btn sec" onclick="closeModal()">Not now</button><button class="btn pri" onclick="closeModal();go('settings');setSettingsPage('subscription')">View Premium</button></div>`);
    return;
  }
  signatureAlign = position; updateSignaturePosition();
});
function updateSignatureArrows() {
  const el = $('#signatureStyles');
  $('#signaturePrev').disabled = el.scrollLeft < 3;
  $('#signatureNext').disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 3;
}
$('#signatureStyles').addEventListener('scroll', updateSignatureArrows, { passive: true });
$('#signaturePrev').onclick = () => $('#signatureStyles').scrollBy({ left: -220, behavior: 'smooth' });
$('#signatureNext').onclick = () => $('#signatureStyles').scrollBy({ left: 220, behavior: 'smooth' });
$('#signatureStyles').addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const desktop = matchMedia('(min-width:861px)').matches;
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? (desktop ? 2 : 1) : (desktop ? -2 : -1);
  signatureStyle = (signatureStyle + delta + SIGNATURE_STYLES.length) % SIGNATURE_STYLES.length;
  renderSignatureStyles(); const b = $(`#signatureStyles [data-signature="${signatureStyle}"]`); b?.focus({ preventScroll: true }); b?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
});
// After editor re-render, keep the selected style in view instead of resetting to the first item.
function preserveDesignScroll(pageIndex, attribute, value) {
  const node = $(`#pages [data-${attribute}="${value}"][data-page="${pageIndex}"]`);
  const rail = node?.closest('.polaroid-options');
  if (node && rail) {
    if (matchMedia('(min-width:861px)').matches) rail.scrollTop += node.getBoundingClientRect().top - rail.getBoundingClientRect().top - rail.clientHeight / 2 + node.clientHeight / 2;
    else rail.scrollLeft += node.getBoundingClientRect().left - rail.getBoundingClientRect().left - rail.clientWidth / 2 + node.clientWidth / 2;
  }
}
function lockedDesignNotice() {
  modal(`<div class="big">🔒</div><h2>Premium photo designs</h2><p>Classic border and Stack layout are included with Free. Unlock all 60 photo borders and 60 photo layouts with Premium.</p><div class="row"><button class="btn sec" onclick="closeModal()">Maybe later</button><button class="btn pri" onclick="closeModal();go('settings');setSettingsPage('subscription')">✦ View subscription</button></div>`);
}

// Six original geometry families × six deliberate variations each.
// Existing 24 layouts keep their original positions for saved envelopes.
function advancedPhotoCoordinates(layout, index, count) {
  const families = ['terrace','constellation','tiles','bouquet','journey','collage'];
  const family = families.find(v => layout === v || layout.startsWith(v+'-'));
  if (!family) return null;
  if (count <= 1) return [0,12,0];
  const options = PHOTO_LAYOUTS.filter(l => l.id === family || l.id.startsWith(family+'-'));
  const variation = Math.max(0,options.findIndex(l => l.id === layout));
  const base = {
    terrace:[[-50,2,-14],[-17,13,-4],[19,27,7],[50,44,14]],
    constellation:[[-47,10,-22],[28,1,13],[-7,34,6],[47,49,-16]],
    tiles:[[-40,3,-4],[39,3,4],[-39,41,4],[40,41,-4]],
    bouquet:[[-47,33,-23],[-17,4,-9],[18,4,9],[48,33,23]],
    journey:[[-49,44,-13],[-17,10,-4],[18,30,7],[50,3,15]],
    collage:[[-45,6,14],[40,0,-16],[-27,43,-13],[49,42,17]]
  }[family];
  const picks = count === 2 ? [0,3] : count === 3 ? [0,1,3] : [0,1,2,3];
  const chosen = picks.map((pick,k) => {
    const [x,y,r] = base[pick];
    const widen = [1,.76,1.09,.9,1.02,.84][variation];
    const bend = [0,11,-9,5,-6,9][variation];
    const lift = [0,3,7,-5,4,-3][variation];
    return [Math.round(x*widen+(k%2 ? bend:-bend)*.55),Math.max(0,Math.min(55,y+(k%2 ? lift:-lift))),r+(k%2 ? bend:-bend)];
  });
  const midpoint = (Math.min(...chosen.map(p=>p[0]))+Math.max(...chosen.map(p=>p[0])))/2;
  return [chosen[index][0]-midpoint,chosen[index][1],chosen[index][2]];
}
function photoCoordinates(layout, index, count) {
  const designed = advancedPhotoCoordinates(layout, index, count);
  if (designed) return designed;
  const middle = (count - 1) / 2;
  if (layout === 'fan') return [(index - middle) * 46, 13 + Math.abs(index - middle) * 11, (index - middle) * 13];
  if (layout === 'stair') return [(index - middle) * 40, 10 + index * 16, (index - middle) * -3];
  if (layout === 'ribbon') return [(index - middle) * 39, 8 + (index % 2 ? 0 : 22), index % 2 ? 8 : -9];
  if (layout === 'petal') {
    const xs = count === 1 ? [0] : count === 2 ? [-39, 39] : count === 3 ? [-47, 0, 47] : [-46, 43, -33, 33];
    const ys = count === 1 ? [15] : count === 2 ? [10, 10] : count === 3 ? [8, 37, 8] : [6, 6, 35, 35];
    const rs = count === 1 ? [0] : count === 2 ? [-12, 12] : count === 3 ? [-14, 0, 14] : [-16, 16, -9, 9];
    return [xs[index], ys[index], rs[index]];
  }
  if (layout === 'stack') return [(index - middle) * 11, index * 6, (index - middle) * -7];
  const coords = EXTRA_PHOTO_LAYOUT_POSITIONS[layout];
  if (!coords || count === 1) return [0, 12, 0];
  // Select symmetric positions for 2/3 photos so previews never run outside the paper.
  const visible = count === 2 ? [coords[0], coords[1]] : count === 3 ? [coords[0], coords[1], coords[3]] : coords;
  const bounds = visible.reduce((a, p) => [Math.min(a[0], p[0]), Math.max(a[1], p[0])], [Infinity, -Infinity]);
  const center = (bounds[0] + bounds[1]) / 2;
  const pos = visible[index];
  return [pos[0] - center, pos[1], pos[2]];
}
function layoutMiniMarkup(id) {
  return `<span class="layer-mini" aria-hidden="true">${[0, 1, 2, 3].map(k => {
    const [x, y, r] = photoCoordinates(id, k, 4);
    return `<i style="left:50%;top:2px;transform:translateX(calc(-50% + ${Math.round(x * .32)}px)) translateY(${Math.round(y * .28)}px) rotate(${r}deg);z-index:${k + 1}"></i>`;
  }).join('')}</span>`;
}
/* v4.1: reusable layered photo stack in the creator AND the paper reader. */
function photoStackMarkup(srcs, context, pageIndex, selectedStyle = 'classic', selectedLayout = 'stack') {
  const photoStyle = safePhotoStyle(selectedStyle), photoLayout = safePhotoLayout(selectedLayout);
  const list = (srcs || []).filter(safeImage);
  if (!list.length) return '';
  const count = list.length;
  const cards = list.map((src, k) => {
    const [baseX, baseY, baseR] = photoCoordinates(photoLayout, k, count);
    const middle = (count - 1) / 2;
    const fanX = (k - middle) * 94, fanR = (k - middle) * -8, fanY = Math.abs(k - middle) * 9 + 6;
    return `<button type="button" class="polaroid-card" data-photo-open="${context}:${pageIndex}:${k}" aria-label="Open photo ${k + 1} of ${count}" style="--stack-x:${baseX}px;--stack-y:${baseY}px;--stack-r:${baseR}deg;--fan-x:calc(${fanX}px * var(--fan-scale,1));--fan-r:${fanR}deg;--fan-y:${fanY}px;--order:${k + 1}"><span class="polaroid-image"><img src="${src}" alt="Photo ${k + 1} of ${count}" loading="lazy"></span><span class="polaroid-caption">♡ little memory <b>${String(k + 1).padStart(2, '0')}</b></span></button>`;
  }).join('');
  return `<div class="photo-stack-area photo-variant--${photoStyle} photo-layout--${photoLayout}"><div class="photo-stack-title"><span class="photo-bloom">✧</span><span>${count} sweet ${count === 1 ? 'photo' : 'photos'} · hover or tap to explore</span><span class="photo-bloom">✧</span></div><div class="photo-stack" data-photo-stack="${context}" data-paper-index="${pageIndex}" aria-label="Stack of ${count} photos">${cards}</div><button type="button" class="photo-stack-action" data-photo-spread aria-expanded="false">↔ Spread photos</button><div class="photo-index-picker" role="group" aria-label="Open one of the photos">${list.map((_, k) => `<button type="button" data-photo-open="${context}:${pageIndex}:${k}" aria-label="View photo ${k + 1} of ${count}">${k + 1}</button>`).join('')}</div></div>`;
}
const photoViewer = { photos: [], index: 0, opener: null };
function openPhotoViewer(source, pageIndex, index, opener) {
  let imgs = source === 'editor' ? pages[pageIndex]?.photos : recv?.pages[pageIndex]?.photos;
  imgs = (imgs || []).filter(safeImage);
  if (!imgs.length || index < 0 || index >= imgs.length) return;
  photoViewer.photos = imgs; photoViewer.index = index; photoViewer.opener = opener || document.activeElement;
  $('#photoLightbox').dataset.photoStyle = safePhotoStyle((source === 'editor' ? pages[pageIndex] : recv?.pages[pageIndex])?.photoStyle);
  $('#photoLightbox').hidden = false;
  document.body.style.overflow = 'hidden';
  drawPhotoViewer();
  $('#photoLightboxClose').focus({ preventScroll: true });
}
function drawPhotoViewer() {
  const i = photoViewer.index, l = photoViewer.photos.length, img = $('#photoLightboxImage');
  img.src = photoViewer.photos[i]; img.alt = `Envelope picture ${i + 1} of ${l}`;
  img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  $('#photoLightboxCount').textContent = `${i + 1} / ${l}`;
  $('#photoLightboxSubtitle').textContent = l === 1 ? 'One lovely photo' : `${l} precious memories`;
  $('#photoLightboxCaption').textContent = ['A sweet little moment ♡', 'Something worth keeping ✨', 'A lovely memory 💗', 'Made with love 🌸'][i % 4];
  $('#photoLightboxPrev').disabled = l < 2; $('#photoLightboxNext').disabled = l < 2;
}
function movePhotoViewer(dir) { const l = photoViewer.photos.length; if (l < 2) return; photoViewer.index = (photoViewer.index + dir + l) % l; drawPhotoViewer(); }
function closePhotoViewer() {
  if ($('#photoLightbox').hidden) return;
  $('#photoLightbox').hidden = true; document.body.style.overflow = '';
  $('#photoLightboxImage').removeAttribute('src');
  if (photoViewer.opener?.isConnected) photoViewer.opener.focus({ preventScroll: true });
  photoViewer.photos = [];
}
document.addEventListener('click', e => {
  const spread = e.target.closest('[data-photo-spread]');
  if (spread) { const wrap = spread.closest('.photo-stack-area'); const stack = wrap?.querySelector('.photo-stack'); if (stack) { const open = stack.classList.toggle('is-spread'); spread.setAttribute('aria-expanded', String(open)); spread.textContent = open ? '♡ Stack photos' : '↔ Spread photos'; } return; }
  const photo = e.target.closest('[data-photo-open]');
  if (photo) { const [kind, pi, idx] = photo.dataset.photoOpen.split(':'); if (kind === 'editor' || kind === 'reader') openPhotoViewer(kind, +pi, +idx, photo); return; }
});
$('#photoLightboxClose').onclick = closePhotoViewer;
$('#photoLightboxPrev').onclick = () => movePhotoViewer(-1);
$('#photoLightboxNext').onclick = () => movePhotoViewer(1);
$('#photoLightbox').onclick = e => { if (e.target.id === 'photoLightbox') closePhotoViewer() };
let lightboxTouchX = 0;
$('#photoLightboxImage').addEventListener('touchstart', e => { lightboxTouchX = e.changedTouches[0].clientX }, { passive: true });
$('#photoLightboxImage').addEventListener('touchend', e => { const diff = e.changedTouches[0].clientX - lightboxTouchX; if (Math.abs(diff) > 38) movePhotoViewer(diff < 0 ? 1 : -1) }, { passive: true });
function renderPages() {
  activeLetterPage = Math.min(Math.max(activeLetterPage, 0), n() - 1);
  renderPageTabs();
  // Only render the *selected* paper. Other drafts stay in the pages array.
  $('#pages').innerHTML = pages.slice(activeLetterPage, activeLetterPage + 1).map((p, offset) => {
    const i = activeLetterPage + offset;
    return `
        <div class="pg letter-page-panel" id="letterPagePanel" role="tabpanel" aria-labelledby="letterPageTab${i}">
          <div class="pgh"><span>Page ${i + 1}</span><small id="cc${i}">${p.text.length}/600</small></div>
          <textarea maxlength="600" data-i="${i}" aria-label="Page ${i + 1} message" placeholder="${i ? 'Keep going…' : 'Write something sweet…'}">${esc(p.text)}</textarea>
          <div class="pgc"><span>Paper</span><div class="sw sm" data-i="${i}"></div></div>
          <div class="photo-tools">
            <div class="photo-toolbar">
              <label class="photo-add${p.photos.length >= photoLimit() ? ' disabled' : ''}">Add picture<input type="file" accept="image/jpeg,image/png,image/webp" data-photo="${i}" multiple ${p.photos.length >= photoLimit() ? 'disabled' : ''} /></label>
              <small>${p.photos.length}/${photoLimit()} pictures · JPG/PNG/WebP</small>
            </div>
            <div class="photo-design-duo" aria-label="Photo styling choices">
              <div class="polaroid-chooser photo-design-side" role="group" aria-label="Polaroid border style for page ${i + 1}">
                <div class="polaroid-chooser-title"><b>Border <em class="photo-design-count">60 designs</em></b><small>${isPremium() ? '← Swipe to explore →' : 'Classic free · 59 Premium ✦'}</small></div>
                <div class="polaroid-options" tabindex="0" aria-label="Scroll through 60 border styles">${PHOTO_STYLES.map((v, j) => `<button type="button" class="polaroid-style-option photo-variant--${v.id}${safePhotoStyle(p.photoStyle) === v.id ? ' on' : ''}${!isPremium() && j ? ' is-locked' : ''}" data-photo-style="${v.id}" data-page="${i}" aria-pressed="${safePhotoStyle(p.photoStyle) === v.id}" aria-label="${v.name}${!isPremium() && j ? ' - Premium locked' : ''}" title="${v.desc}"><span class="polaroid-mini-frame"><span class="polaroid-mini-picture">♡</span><span class="polaroid-mini-foot"></span></span><span class="polaroid-style-name">${!isPremium() && j ? '🔒 ' : ''}${v.name}</span></button>`).join('')}</div>
              </div>
              <div class="polaroid-chooser photo-design-side" role="group" aria-label="Polaroid layering format for page ${i + 1}">
                <div class="polaroid-chooser-title"><b>Layout <em class="photo-design-count">60 designs</em></b><small>${isPremium() ? '← Swipe to explore →' : 'Stack free · 59 Premium ✦'}</small></div>
                <div class="polaroid-options" tabindex="0" aria-label="Scroll through 60 photo layouts">${PHOTO_LAYOUTS.map((v, j) => `<button type="button" class="polaroid-style-option layer-style-option${safePhotoLayout(p.photoLayout) === v.id ? ' on' : ''}${!isPremium() && j ? ' is-locked' : ''}" data-photo-layout="${v.id}" data-page="${i}" aria-pressed="${safePhotoLayout(p.photoLayout) === v.id}" aria-label="${v.name}${!isPremium() && j ? ' - Premium locked' : ''}" title="${v.desc}">${layoutMiniMarkup(v.id)}<span class="polaroid-style-name">${!isPremium() && j ? '🔒 ' : ''}${v.name}</span></button>`).join('')}</div>
              </div>
            </div>
            <div class="photo-previews">${photoStackMarkup(p.photos, 'editor', i, p.photoStyle, p.photoLayout)}${!p.photos.length ? '' : ''}${p.photos.length ? `<div class="photo-remove-list">${p.photos.map((_, k) => `<button type="button" data-remove-photo="${i}:${k}" aria-label="Remove photo ${k + 1}">✕ Photo ${k + 1}</button>`).join('')}</div>` : ''}</div>
          </div>
          <div class="effect-picker"><b>Page emoji transition</b><small>${isPremium() ? ' Choose an animation for this paper.' : ' Premium feature — subscribe to customize.'}</small>
            <select data-effect="${i}" ${isPremium() ? '' : 'disabled'}>
              ${[['none', 'No effect'], ['hearts', '💗 Floating hearts'], ['sparkles', '✨ Sparkles'], ['flowers', '🌸 Floating flowers'], ['stars', '⭐ Twinkling stars'], ['butterflies', '🦋 Butterflies']].map(([v, t]) => `<option value="${v}" ${p.effect === v ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>`;
  }).join('');
  $$('#pages [data-photo-style]').forEach(b => b.onclick = () => {
    const id = safePhotoStyle(b.dataset.photoStyle), i = Number(b.dataset.page);
    if (!isPremium() && id !== 'classic') return lockedDesignNotice();
    pages[i].photoStyle = id; renderPages(); preserveDesignScroll(i, 'photo-style', id); toast('Border style updated ♡');
  });
  $$('#pages [data-photo-layout]').forEach(b => b.onclick = () => {
    const id = safePhotoLayout(b.dataset.photoLayout), i = Number(b.dataset.page);
    if (!isPremium() && id !== 'stack') return lockedDesignNotice();
    pages[i].photoLayout = id; renderPages(); preserveDesignScroll(i, 'photo-layout', id); toast('Photo layout updated ♡');
  });
  $$('#pages [data-effect]').forEach(select => select.onchange = () => { pages[+select.dataset.effect].effect = select.value; refreshPageTabMarkers() });
  $$('#pages .sw').forEach(el => { const i = +el.dataset.i; swatches(el, availableColors('paper', pages[i].color), pages[i].color, c => { pages[i].color = c; if (i === 0) { paper = c; renderColorPalettes(); } updPreview() }) });
  $$('#pages textarea').forEach(t => t.oninput = () => { const i = +t.dataset.i; pages[i].text = t.value; $('#cc' + i).textContent = t.value.length + '/600'; refreshPageTabMarkers(); updateStudioCanvas(); });
  $$('#pages [data-photo]').forEach(input => input.onchange = async e => {
    if (photoBusy) { toast('Please finish uploading the current pictures first'); return }
    const i = +input.dataset.photo; const files = [...e.target.files]; input.value = '';
    if (pages[i].photos.length + files.length > photoLimit()) return toast(`Maximum of ${photoLimit()} pictures per paper`);
    photoBusy = true; $('#make').disabled = true; toast('Preparing your pictures...');
    try { for (const f of files) pages[i].photos.push(await compressPhoto(f)); renderPages(); toast('Picture added ♡') }
    catch (err) { renderPages(); toast(err.message || 'Could not read this picture') }
    finally { photoBusy = false; $('#make').disabled = false }
  });
  $$('#pages [data-remove-photo]').forEach(b => b.onclick = () => {
    const [i, k] = b.dataset.removePhoto.split(':').map(Number);
    pages[i].photos.splice(k, 1); renderPages();
  });
  updPreview();
  updateStudioCanvas();
  renderMobilePhotoPicker();
}
async function compressPhoto(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw Error('Choose JPG, PNG or WebP only');
  if (file.size > 8 * 1024 * 1024) throw Error('Picture must be smaller than 8 MB');
  const src = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = src; await img.decode();
    const ratio = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext('2d'); if (!ctx) throw Error('Image editor unavailable');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let result = '';
    for (const q of [.78, .65, .50, .38]) { result = canvas.toDataURL('image/jpeg', q); if (result.length < 125000) break }
    if (result.length >= 190000) throw Error('Image is still too large. Try a smaller photo');
    return result;
  } finally { URL.revokeObjectURL(src) }
}
function resetLetterEditor() {
  editingId = null; envColor = ENV[0]; paper = PAPER[0]; pages = blank(); activeLetterPage = 0; studioTool = 'title'; studioCollapsed = false; paperMagic = { ...DEFAULT_PAPER_MAGIC };
  $('#title').value = $('#from').value = $('#signatureText').value = ''; $('#coverText').value = DEFAULT_COVER_TEXT; signatureStyle = 0; signatureAlign = 'right';
  $('#editorTitle').textContent = 'Design your envelope';
  $('#editorSubtitle').textContent = 'Pick the colors, then write each page.';
  $('#editBanner').hidden = true; $('#make').textContent = window.WENV_ANON?.composing ? '💌 Send envelope message' : '💌 Seal my envelope';
  updatePageOptions(); $('#count').value = '1'; renderColorPalettes(); renderPages(); renderSignatureStyles(); updateCoverEditorLock(); updatePaperMagicEditor(); applyCreateWizard();
}
function editEnv(id) {
  if (!currentUser) return toast('Please sign in before editing.');
  const e = store.find(v => v.id === id);
  if (!e) return toast('Envelope not found. Please refresh My Envelopes.');
  try {
    closeModal(); editingId = e.id; envColor = e.envelopeColor; paperMagic = { ...safePaperMagic(e.paperMagic || DEFAULT_PAPER_MAGIC) };
    pages = blank(); e.pages.forEach((p, i) => { pages[i] = { text: p.text, color: p.color, photos: [...(p.photos || [])], effect: p.effect || 'none', photoStyle: safePhotoStyle(p.photoStyle), photoLayout: safePhotoLayout(p.photoLayout) } });
    $('#title').value = e.title; $('#from').value = e.from || ''; $('#coverText').value = safeCoverText(e.coverText);
    signatureStyle = e.signature?.style || 0; signatureAlign = e.signature?.align || 'right'; $('#signatureText').value = e.signature?.text || '';
    activeLetterPage = 0;
    $('#editorTitle').textContent = 'Edit existing envelope ✏️';
    $('#editorSubtitle').textContent = 'Make changes without creating a new envelope. Existing short links will be refreshed.';
    $('#editBanner').hidden = false; $('#make').textContent = '☁️ Save changes';
    updatePageOptions(); $('#count').value = String(e.pages.length); studioTool = 'title'; studioCollapsed = false;
    renderColorPalettes();
    renderPages(); renderSignatureStyles(); updateCoverEditorLock(); updatePaperMagicEditor(); go('create');
    // A visible and accessible edit state confirms the correct record was loaded.
    $('#editBanner').scrollIntoView({ block: 'nearest', behavior: 'auto' });
  } catch (error) {
    console.error('Failed to open envelope editor:', error);
    toast('Could not open editor. Please refresh and try again.');
  }
}
$('#cancelEdit').onclick = () => { resetLetterEditor(); go('dash') };
async function refreshPublishedLinks(e) {
  const codes = [...new Set([...(e.linkCodes || []), e.shortCode, e.customCode].filter(Boolean))];
  if (!codes.length) return true;
  let ok = true;
  for (const code of codes) try { if (!await window.WENV_DB.claim(code, e, currentUser.uid)) ok = false; }
    catch (err) { console.warn('Failed to update public link', code, err); ok = false }
  return ok;
}
let creating = false;
async function create() {
  if (window.WENV_ANON?.composing) return window.WENV_ANON.beginSend();
  if (!currentUser) return;
  if (!cloudReady) return toast('Cloud sync is not connected yet. Please check Firebase settings.');
  if (photoBusy || creating) return toast('Finish uploading your pictures first');
  if (n() > pageLimit() && !editingId) return toast('Subscribe to Premium for 9–10 pages');
  const t = $('#title').value.trim();
  if (!t) { if (createWizardMobile()) selectStudioTool('title'); const input = $('#title'); input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); input.focus(); return toast('Give your envelope a title first 💌') }
  const original = editingId ? store.find(v => v.id === editingId) : null;
  if (editingId && !original) return toast('Original envelope not found. Refresh and try again.');
  const e = clean({
    id: original?.id || uid(), title: t, from: $('#from').value.trim(), envelopeColor: envColor,
    coverText: editorCoverText(),
    paperMagic: isPremium() ? safePaperMagic(paperMagic) : safePaperMagic(original?.paperMagic || { typewriter: false, pageTurn: false, bouquetIntro: false, typingSpeed: 'classic' }),
    createdAt: original?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    shortCode: original?.shortCode, customCode: original?.customCode, linkCodes: original?.linkCodes,
    signature: { text: $('#signatureText').value.trim(), style: signatureStyle, align: isPremium() ? signatureAlign : (original?.signature?.align || 'right') },
    pages: pages.slice(0, n()).map((p, pageIndex) => ({ text: p.text.trim() || 'A little message just for you. ♡', color: p.color, photos: p.photos, effect: p.effect || 'none', photoStyle: isPremium() ? safePhotoStyle(p.photoStyle) : (p.photoStyle === 'classic' ? 'classic' : (original ? safePhotoStyle(original.pages?.[pageIndex]?.photoStyle) : 'classic')), photoLayout: isPremium() ? safePhotoLayout(p.photoLayout) : (p.photoLayout === 'stack' ? 'stack' : (original ? safePhotoLayout(original.pages?.[pageIndex]?.photoLayout) : 'stack')) }))
  });
  creating = true; $('#make').disabled = true; $('#make').textContent = editingId ? '☁️ Updating envelope...' : '☁️ Saving envelope...';
  try {
    await cloudPut(e);
    const linksUpdated = await refreshPublishedLinks(e);
    store = [e, ...store.filter(v => v.id !== e.id)]; renderDash(); created = e;
    const wasEditing = !!editingId;
    resetLetterEditor();
    modal(`<div class="big brand-big"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><h2>${wasEditing ? 'Changes saved!' : 'Envelope saved to the cloud!'}</h2><p>${wasEditing ? 'Your existing envelope was updated.' : 'Your envelope is stored under your Google account.'} ${linksUpdated ? 'Existing short links are up to date.' : 'Some older links could not be refreshed; check your Firebase rules.'}</p><div class="row"><button class="btn sec" onclick="closeModal();previewEnv('${e.id}')">View</button><button class="btn pri" onclick="shareEnv('${e.id}')">🔗 Short link</button></div>`);
    cloudState('☁️ Envelopes synced', 'ok');
    burst(null, 20);
  } catch (err) {
    console.error(err);
    cloudState('⚠️ Unable to save. Your unsaved draft is still in the editor.', 'error');
    toast('Cloud save failed. Check Firebase rules. Your draft is still here.');
  }
  finally { creating = false; $('#make').disabled = false; $('#make').textContent = editingId ? '☁️ Save changes' : '💌 Seal my envelope' }
}



/* v14 Username directory & direct mail (Firebase RTDB; no hardcoded demo users). */
const validUsername = value => /^[a-z0-9_]{3,20}$/.test(value);
const normalizeUsername = value => String(value || '').toLowerCase().replace(/^@/, '').trim();
const USERNAME_CHANGE_INTERVAL = 7 * 24 * 60 * 60 * 1000;
let myUsername = '', usernameChangedAt = 0, usernameEditing = false, usernameBusy = false;
let pickedRecipient = null, searchToken = 0, selectedMailId = null;
function usernameAvailableAt() { return myUsername ? usernameChangedAt + USERNAME_CHANGE_INTERVAL : 0; }
function usernameRemainingMs() { return Math.max(0, usernameAvailableAt() - Date.now()); }
function usernameRemainingText(ms) {
  if (ms <= 0) return 'You can update your username now.';
  const days = Math.floor(ms / 86400000), hours = Math.floor((ms % 86400000) / 3600000), minutes = Math.ceil((ms % 3600000) / 60000);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${Math.max(1,minutes)}m`;
}
function setUsernameLabel() {
  const label = $('#myUsernameLabel');
  if (label) label.textContent = myUsername ? '@' + myUsername : 'Not set yet';
  const edit = $('#editMyUsername');
  const panel = $('#usernameEditPanel');
  const field = $('#myUsernameInput');
  const button = $('#saveMyUsername');
  const cooldown = $('#usernameCooldown');
  const remaining = usernameRemainingMs();
  if (edit) {
    edit.disabled = usernameBusy;
    edit.setAttribute('aria-label', myUsername ? 'Edit username' : 'Claim a username');
    edit.title = remaining ? 'Username editing unlocks after 7 days' : 'Edit username';
    edit.classList.toggle('identity-on-cooldown', remaining > 0);
    edit.setAttribute('aria-expanded', String(usernameEditing));
  }
  if (panel) panel.hidden = !usernameEditing;
  const overlay=$('#usernameModalBackdrop');
  if (overlay) overlay.hidden=!usernameEditing;
  if (field) { field.disabled = usernameBusy; if (!usernameEditing) field.value = myUsername; }
  if (button) {
    button.disabled = usernameBusy || remaining > 0;
    if (!usernameBusy) button.textContent = myUsername ? 'Save changes' : 'Claim username';
  }
  if (cooldown) {
    cooldown.textContent = myUsername
      ? (remaining ? `🔒 Username changes unlock in ${usernameRemainingText(remaining)}. You can change it once every 7 days.` : '✓ You can change your username. After saving, the next change is available in 7 days.')
      : 'Claim your unique username to receive envelopes through Send Envelope.';
    cooldown.classList.toggle('is-waiting', remaining > 0);
  }
}
async function loadMyUsername(uid) {
  myUsername = ''; usernameChangedAt = 0; usernameEditing = false; setUsernameLabel();
  try {
    const profile = await window.WENV_DB.getMyProfile(uid);
    if (currentUser?.uid !== uid) return;
    myUsername = validUsername(profile?.username) ? profile.username : '';
    // v14 accounts didn't have the timestamp; use their original username reservation time.
    usernameChangedAt = Number(profile?.usernameChangedAt) || 0;
    if (myUsername && !usernameChangedAt) {
      const directory = await window.WENV_DB.getUsername(myUsername);
      if (currentUser?.uid !== uid) return;
      if (directory?.uid === uid) usernameChangedAt = Number(directory.createdAt) || Date.now();
    }
    setUsernameLabel();
    // An interrupted rename cannot strand an old searchable username indefinitely.
    if (validUsername(profile?.previousUsername) && profile.previousUsername !== myUsername) {
      try {
        await window.WENV_DB.releaseOldUsername(profile.previousUsername,uid);
        await window.WENV_DB.clearPreviousUsername(uid);
      } catch (cleanupErr) { console.warn('Pending old username cleanup',cleanupErr); }
    }
  } catch(err) { console.warn('Username profile unavailable',err); }
}
function usernameStatus(message,error=false) {
  const node = $('#usernameStatus'); node.textContent=message; node.classList.toggle('is-error',error);
  const dialogNode=$('#usernameModalStatus');
  if (dialogNode){dialogNode.textContent=message; dialogNode.classList.toggle('is-error',error);}
}
$('#editMyUsername').addEventListener('click',()=>{
  if (!currentUser || usernameBusy) return;
  usernameEditing = !usernameEditing;
  usernameStatus(usernameRemainingMs() ? `Your next username change is available in ${usernameRemainingText(usernameRemainingMs())}.` : '');
  setUsernameLabel();
  if (usernameEditing) { $('#myUsernameInput').value = myUsername; $('#myUsernameInput').focus(); }
});
$('#cancelUsernameEdit').addEventListener('click',()=>{
  usernameEditing=false;usernameStatus('');setUsernameLabel();
});
function cancelUsernameDialog(){
  if(usernameBusy)return;
  usernameEditing=false;usernameStatus('');setUsernameLabel();
  $('#editMyUsername').focus({preventScroll:true});
}
$('#usernameModalClose').addEventListener('click',cancelUsernameDialog);
$('#usernameModalBackdrop').addEventListener('click',e=>{if(e.target.id==='usernameModalBackdrop')cancelUsernameDialog();});
document.addEventListener('keydown',e=>{
  if($('#usernameModalBackdrop').hidden)return;
  if(e.key==='Escape'){e.preventDefault();cancelUsernameDialog();}
  if(e.key==='Enter' && e.target.id==='myUsernameInput'){$('#saveMyUsername').click();}
  if(e.key==='Tab'){
    const focusable=[...$('#usernameModalBackdrop').querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    if(!focusable.length)return;
    if(e.shiftKey && document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}
    else if(!e.shiftKey && document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}
  }
});
// The database enforces the 7-day cooldown too; no localStorage-based limit.
$('#saveMyUsername').addEventListener('click',async()=>{
  if (!currentUser || !window.WENV_DB?.reserveUsername || usernameBusy) return;
  if (usernameRemainingMs()) return usernameStatus('Your 7-day username cooldown is still active.',true);
  const name = normalizeUsername($('#myUsernameInput').value);
  if (!validUsername(name)) return usernameStatus('Use 3–20 lowercase letters, numbers, or underscores.',true);
  if (name===myUsername) { usernameEditing=false;setUsernameLabel();return usernameStatus('No changes to save.'); }
  usernameBusy=true; setUsernameLabel();
  const button=$('#saveMyUsername');button.textContent='Saving…';
  const oldName=myUsername, currentUid=currentUser.uid;
  let claimed=false,profileSaved=false;
  try {
    const saved=await window.WENV_DB.reserveUsername(name,currentUid,String(currentUser.displayName||'Envelope friend').slice(0,60));
    if (!saved) return usernameStatus('That username is taken. Try another one.',true);
    claimed=true;
    // Reserve first, then update profile (rules check reservation ownership), finally retire old username.
    await window.WENV_DB.setMyProfile(currentUid,{username:name,usernameChangedAt:window.WENV_DB.serverTimestamp(),...(oldName?{previousUsername:oldName}:{})});
    profileSaved=true;
    if (currentUser?.uid!==currentUid) return;
    myUsername=name;usernameChangedAt=Date.now();usernameEditing=false;
    let retired = true;
    if (oldName && oldName!==name) {
      try {
        retired = await window.WENV_DB.releaseOldUsername(oldName,currentUid);
        if (retired) await window.WENV_DB.clearPreviousUsername(currentUid);
      } catch(cleanupError) {retired = false; console.warn('Old username cleanup pending',cleanupError);}
    }
    usernameStatus(retired
      ? `✓ @${name} is now your searchable username. Next change available in 7 days.`
      : `✓ @${name} saved, but old username cleanup is pending. Reopen Account & Data when online.`,!retired);
    toast(oldName ? 'Username updated ♡' : 'Username claimed ♡');
  } catch(err) {
    console.error('Username update failed',err);
    usernameStatus(err?.code === 'PERMISSION_DENIED' || String(err?.message||'').includes('PERMISSION_DENIED') ? 'Permission denied by Firebase. Deploy database.rules.json and confirm your 7-day cooldown.' : 'Could not update username: ' + String(err?.message||'Please retry when online.').slice(0,130),true);
    if (claimed && !profileSaved && name!==oldName) {
      try {await window.WENV_DB.releaseOldUsername(name,currentUid)} catch(cleanupError){console.warn('Reservation cleanup failed',cleanupError)}
    }
  } finally {usernameBusy=false;setUsernameLabel();}
});
setInterval(()=>{if(currentUser && $('#settings-account')?.classList.contains('on'))setUsernameLabel();},60000);
const searchResults = $('#usernameSearchResults');
let usernameDebounce=0;
$('#recipientSearchInput').addEventListener('input',()=>{
  clearTimeout(usernameDebounce);const token=++searchToken;
  const query=normalizeUsername($('#recipientSearchInput').value);
  pickedRecipient=null;selectedMailId=null;
  $('#sendEnvelopeStep').hidden=true;
  if(query.length<2){searchResults.innerHTML='<p class="mail-empty">Type at least 2 characters to find a username.</p>';return}
  if(!/^[a-z0-9_]{2,20}$/.test(query)){searchResults.innerHTML='<p class="mail-empty">Use letters, numbers, or underscores.</p>';return}
  searchResults.innerHTML='<p class="mail-empty">Searching usernames…</p>';
  usernameDebounce=setTimeout(async()=>{
    if(!window.WENV_DB?.searchUsernames){searchResults.innerHTML='<p class="mail-empty">Connecting to Firebase…</p>';return}
    try{
      const matches=await window.WENV_DB.searchUsernames(query);
      if(token!==searchToken || !currentUser)return;
      searchResults.innerHTML=matches.length ? matches.map(v=>`<button type="button" class="mail-user-result" data-recipient-name="${esc(v.username)}"><span class="mail-user-avatar">@</span><span><strong>@${esc(v.username)}</strong><small>${esc(v.displayName||'W-Envelope member')}</small></span><span>Choose ›</span></button>`).join('') : '<p class="mail-empty">No usernames found. Ask your friend to claim a username in Settings → Account & Data.</p>';
    }catch(err){console.warn(err);searchResults.innerHTML='<p class="mail-empty">Search unavailable. Make sure the database rules are published.</p>'}
  },260);
});
searchResults.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-recipient-name]');if(!btn)return;
  const username=btn.dataset.recipientName;
  // Resolve fresh; never trust user-supplied UID or stale search cards.
  try{
    const found=await window.WENV_DB.getUsername(username);
    if(!found?.uid){toast('That username is no longer available');return}
    if(found.uid===currentUser?.uid){toast('Choose a different recipient ♡');return}
    pickedRecipient={uid:found.uid,username,displayName:found.displayName||username};
    $('#selectedRecipient').textContent='Send to @'+username;
    $('#sendEnvelopeStep').hidden=false;
    $('#recipientEnvelopeChoices').innerHTML=store.length ? store.map(env=>`<button class="mail-envelope-choice" type="button" data-pick-envelope="${esc(env.id)}"><span class="mail-letter-icon">💌</span><span><strong>${esc(env.title)}</strong><small>${env.pages.length} pages · ${esc(fmt(env.createdAt))}</small></span><span class="mail-check">○</span></button>`).join('') : '<p class="mail-empty">No recent envelopes yet. Create and save an envelope first.</p>';
    selectedMailId=null;$('#prepareEnvelopeSend').disabled=true;
    $('#recipientEnvelopeChoices').scrollIntoView({block:'nearest',behavior:calm?'auto':'smooth'});
  }catch(err){console.error(err);toast('Could not load recipient. Try again.')}
});
$('#recipientEnvelopeChoices').addEventListener('click',e=>{
  const card=e.target.closest('[data-pick-envelope]');if(!card)return;
  selectedMailId=card.dataset.pickEnvelope;
  $$('#recipientEnvelopeChoices [data-pick-envelope]').forEach(btn=>{
    btn.classList.toggle('selected',btn===card);
    btn.querySelector('.mail-check').textContent=btn===card?'✓':'○';
  });
  $('#prepareEnvelopeSend').disabled=false;
});
$('#prepareEnvelopeSend').addEventListener('click',()=>{
  if(!pickedRecipient || !store.some(e=>e.id===selectedMailId))return;
  const real=String(currentUser?.displayName||currentUser?.email?.split('@')[0]||myUsername||'Someone').slice(0,50);
  modal(`<div class="mail-send-modal"><div class="big">💌</div><h2>Before you send…</h2><p>How should <b>@${esc(pickedRecipient.username)}</b> see your sender name?</p><div class="sender-options"><label class="sender-option"><input type="radio" name="senderMode" value="real" checked><span><b>My real Google display name</b><small>${esc(real)}</small></span></label><label class="sender-option"><input type="radio" name="senderMode" value="anonymous"><span><b>Random anonymous name</b><small>We will choose a cute mystery name.</small></span></label><label class="sender-option ${isPremium()?'':'sender-option-locked'}"><input type="radio" name="senderMode" value="custom" ${isPremium()?'':'disabled'}><span><b>✦ My custom sender name ${isPremium()?'':'🔒 Premium'}</b><small>Personalize your signature for this delivery.</small></span></label></div><label class="mail-custom-field" id="mailCustomField" hidden>Custom sender name<input id="customSenderName" maxlength="40" placeholder="e.g. A Secret Admirer" autocomplete="off"></label><p id="mailSendError" class="mail-error" role="alert"></p><div class="row"><button class="btn sec" onclick="closeModal()">Cancel</button><button class="btn pri" type="button" id="confirmEnvelopeSend">Send envelope 💌</button></div></div>`);
  $$('#mc input[name="senderMode"]').forEach(input=>input.onchange=()=>{$('#mailCustomField').hidden=input.value!=='custom'});
  $('#confirmEnvelopeSend').onclick=()=>deliverEnvelope(real);
});
const anonymousNames=['Secret Star ✨','Moonlight Messenger 🌙','Hidden Rose 🌹','Mystery Heart 💗','Anonymous Butterfly 🦋','Secret Sunbeam ☀️','Dreamy Stranger 💌'];
async function deliverEnvelope(realName){
  if(!currentUser || !pickedRecipient || !selectedMailId)return;
  const envelope=store.find(e=>e.id===selectedMailId);if(!envelope)return;
  const chosen=$('#mc input[name="senderMode"]:checked')?.value||'real';
  if(chosen==='custom' && !isPremium()){ $('#mailSendError').textContent='Custom sender names require Premium.';return }
  const custom=$('#customSenderName')?.value.trim()||'';
  if(chosen==='custom' && (custom.length<2||custom.length>40)){ $('#mailSendError').textContent='Custom name must be 2–40 characters.';return }
  const displayName=chosen==='anonymous' ? anonymousNames[Math.floor(Math.random()*anonymousNames.length)] : chosen==='custom'?custom:realName;
  const to={...pickedRecipient};const button=$('#confirmEnvelopeSend');button.disabled=true;
  modal(`<div class="mail-progress" role="status" aria-live="polite"><div class="mail-spinner"></div><h2>Sending your envelope…</h2><p>Securing your letter and delivering it to @${esc(to.username)}.</p></div>`);
  try{
    if(!cloudReady)throw Error('Your envelopes are not yet synced');
    const code=await ensureCode(envelope);
    // Check recipient again to avoid accidentally sending to a renamed username.
    const latest=await window.WENV_DB.getUsername(to.username);
    if(!latest || latest.uid!==to.uid)throw Error('Recipient username changed. Search again.');
    await window.WENV_DB.sendDirectEnvelope(to.uid,{
      title:envelope.title,code,from:displayName,senderMode:chosen,
      senderUid:currentUser.uid,senderUsername:myUsername||'',recipientUid:to.uid,
      receivedAt:new Date().toISOString(),createdAt:envelope.createdAt
    });
    modal(`<div class="big">💌</div><h2>Envelope delivered!</h2><p><strong>${esc(envelope.title)}</strong> is now in <b>@${esc(to.username)}</b>'s Received Envelopes, with a new-mail badge.</p><button type="button" class="btn pri wide" onclick="closeModal()">Lovely! ♡</button>`);
    $('#recipientSearchInput').value='';searchResults.innerHTML='<p class="mail-empty">Search another username to send again.</p>';
    $('#sendEnvelopeStep').hidden=true;pickedRecipient=null;selectedMailId=null;
  }catch(err){console.error('Direct send:',err);modal(`<div class="big">✉️</div><h2>Couldn’t deliver the letter</h2><p>${esc(err?.message || 'Please try again. Ensure the updated database rules are published.')}</p><button class="btn pri wide" type="button" onclick="closeModal()">Try again</button>`)}
}

/* dashboard */
function renderDash() {
  const L = $('#list');
  $('#recentCount').textContent = store.length; $('#receivedCount').textContent = receivedStore.length;
  const unread = receivedStore.filter(e => (e.senderUid || e.anonymous) && !e.readAt).length;
  $('#receivedUnread').hidden = unread === 0; $('#receivedUnread').textContent = unread > 99 ? '99+' : String(unread);
  const navCount = $('#mailboxNavBadge'); if (navCount) { navCount.hidden = !unread; navCount.textContent = unread > 99 ? '99+' : String(unread); }
  document.title = unread ? `(${unread}) 💌 W-Envelope Cute` : 'W-Envelope Cute';
  $('#total').textContent = `${store.length} created · ${receivedStore.length} received`;
  renderAccountDashboard();
  $('#recentTab').classList.toggle('on', mailboxView === 'recent'); $('#receivedTab').classList.toggle('on', mailboxView === 'received'); $('#sendTab').classList.toggle('on', mailboxView === 'send');
  $('#mailboxSend').hidden = mailboxView !== 'send'; $('#list').hidden = mailboxView === 'send';
  $('#recentTab').setAttribute('aria-selected', String(mailboxView === 'recent')); $('#receivedTab').setAttribute('aria-selected', String(mailboxView === 'received')); $('#sendTab').setAttribute('aria-selected', String(mailboxView === 'send'));
  $('#mailboxNote').textContent = mailboxView === 'recent' ? 'Letters you created. Edit them anytime, then share the same short link.' : mailboxView === 'received' ? 'Letters people sent you. New deliveries are marked until you read them.' : 'Search a username, choose a saved envelope, and send it straight to their mailbox.';
  if (mailboxView === 'send') { L.innerHTML = ''; return; }
  if (mailboxView === 'recent') {
    if (!store.length) { L.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="big brand-big"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><h3>No recent envelopes</h3><p class="soft">Start with your first letter.</p><button class="btn pri" data-go="create">Create envelope</button></div>'; return }
    L.innerHTML = store.map(e => `<article class="card"><div class="thumb" style="background:${shade(e.envelopeColor, .72)}">${envHTML(e.envelopeColor, e.pages.map(p => p.color), { coverText: e.coverText })}</div><div class="info"><h3>${esc(e.title)}</h3><div class="meta"><span class="chip">${e.pages.length} pages</span><small>${fmt(e.updatedAt || e.createdAt)}</small></div><div class="acts"><button type="button" class="btn sec" data-envelope-action="view" data-envelope-id="${esc(e.id)}">View</button><button type="button" class="btn sec edit-envelope-btn" data-envelope-action="edit" data-envelope-id="${esc(e.id)}" aria-label="Edit ${esc(e.title)}">Edit</button><button type="button" class="btn pri" data-envelope-action="share" data-envelope-id="${esc(e.id)}">Share</button><button type="button" class="btn dng" data-envelope-action="delete" data-envelope-id="${esc(e.id)}" aria-label="Delete ${esc(e.title)}">🗑</button></div></div></article>`).join('');
  } else {
    if (!receivedStore.length) { L.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="big">📭</div><h3>No received envelopes yet</h3><p class="soft">Open a shared envelope link and it will be saved to this collection.</p></div>'; return }
    L.innerHTML = receivedStore.map(e => `<article class="card"><div class="thumb" style="background:linear-gradient(135deg,#ffe1f0,#eadfff)"><img class="received-brand-logo" src="assets/w-envelope-icon.png" alt="W-Envelope Cute logo"></div><div class="info"><h3>${esc(e.title || 'Lovely letter')}</h3><div class="meta"><span class="chip">From ${esc(e.from || 'Someone')}</span>${(e.senderUid || e.anonymous) && !e.readAt ? '<span class="unread-chip">● New</span>' : ''}<small>${fmt(e.receivedAt)}</small></div><div class="acts"><button class="btn pri" data-received="${esc(e.key)}">Read letter</button><button class="btn dng" data-remove-received="${esc(e.key)}" aria-label="Remove from received">Remove</button></div></div></article>`).join('');
  }
}
function renderAccountDashboard() {
  const node = $('#accCreated');
  if (!node) return;
  const count = store.length, received = receivedStore.length;
  const pagesSaved = store.reduce((sum, e) => sum + (e.pages?.length || 0), 0);
  const photosSaved = store.reduce((sum, e) => sum + (e.pages || []).reduce((subtotal, pg) => subtotal + (pg.photos?.length || 0), 0), 0);
  const linksSaved = new Set(store.flatMap(e => [...(e.linkCodes || []), e.shortCode, e.customCode].filter(Boolean))).size;
  const pending = premiumPayments.filter(p => p.status === 'pending').length;
  const approved = premiumPayments.filter(p => p.status === 'approved').length;
  $('#accCreated').textContent = count.toLocaleString();
  $('#accReceived').textContent = received.toLocaleString();
  $('#accPages').textContent = pagesSaved.toLocaleString();
  $('#accPhotos').textContent = photosSaved.toLocaleString();
  $('#accLinks').textContent = linksSaved.toLocaleString();
  $('#accRequests').textContent = premiumPayments.length.toLocaleString();
  $('#accRequestStatus').textContent = `${pending} pending · ${approved} approved`;
  const total = count + received;
  $('#accCreatedBar').style.width = `${total ? count / total * 100 : 0}%`;
  $('#accReceivedBar').style.width = `${total ? received / total * 100 : 0}%`;
  $('#accActivityTotal').textContent = total ? `${total} total envelopes` : 'No saved activity yet';
  const latest = store.map(e => e.updatedAt || e.createdAt).filter(Boolean).sort().at(-1);
  $('#accLatestUpdate').textContent = latest && !isNaN(Date.parse(latest)) ? fmt(latest) : 'No envelopes yet';
  $('#accountPlanBadge').textContent = isPremium() ? '✦ Premium active' : 'Free plan';
  $('#accountPlanBadge').classList.toggle('is-premium', isPremium());
  $('#accPremiumDetail').textContent = isPremium() ? 'Active · ' + premiumLeftText(premiumRemaining()) + ' remaining' : pending ? 'Free · payment under review' : 'Free · upgrade available';
  const uid = currentUser?.uid || '';
  $('#accUidMasked').textContent = uid ? uid.slice(0, 6) + '…' + uid.slice(-4) : '—';
  const signed = currentUser?.metadata?.lastSignInTime;
  $('#accountLastLogin').textContent = signed && !isNaN(Date.parse(signed)) ? fmt(signed) : 'Not provided';
  $('#accountAuthState').textContent = currentUser ? 'Google connected' : 'Not signed in';
  $('#accountCloudState').textContent = !currentUser ? 'Signed out' : cloudReady ? '☁ Cloud synced' : 'Sync pending';
  $('#accountCloudState').classList.toggle('online', !!(currentUser && cloudReady));
}
function setMailbox(view) { mailboxView = view; renderDash(); }
$('#recentTab').onclick = () => setMailbox('recent');
$('#receivedTab').onclick = () => setMailbox('received');
$('#sendTab').onclick = () => setMailbox('send');
document.addEventListener('click', async event => {
  const view = event.target.closest('[data-received]');
  if (view) {
    const item = receivedStore.find(v => v.key === view.dataset.received); if (!item) return;
    if ((item.senderUid || item.anonymous) && !item.readAt) window.WENV_DB.markReceivedRead(currentUser.uid, item.key).catch(console.warn);
    if (item.code) { location.hash = 'e=' + encodeURIComponent(item.code); checkHash() }
    else if (item.envelope) { setup(clean(item.envelope), true) }
    return;
  }
  const remove = event.target.closest('[data-remove-received]');
  if (remove) {
    const key = remove.dataset.removeReceived;
    try { await window.WENV_DB.removeReceived(currentUser.uid, key); toast('Removed from received letters') }
    catch (err) { console.error(err); toast('Could not remove received letter') }
  }
});
function askDelete(id) {
  modal(`<div class="big">🥺</div><h2>Delete this envelope?</h2><p>Remove it from your synced collection? Existing shared links will keep working; only share envelopes you trust others to read.</p><div class="row"><button class="btn sec" onclick="closeModal()">Keep it</button><button class="btn dng" onclick="delEnv('${id}')">Delete</button></div>`)
}
async function delEnv(id) {
  if (!cloudReady) return toast('Cloud unavailable. Try again when synced.');
  try { await cloudRemove(id); closeModal(); toast('Envelope removed from your cloud collection') }
  catch (err) { console.error(err); toast('Could not delete the envelope from Firebase') }
}

/* short links: Firebase stores envelope payload, never in the link itself */
const enc = e => { const j = JSON.stringify({ title: e.title, from: e.from, envelopeColor: e.envelopeColor, pages: e.pages }); return btoa(String.fromCharCode(...new TextEncoder().encode(j))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
const dec = s => { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)))) } catch { return null } };
const shortUrl = code => location.href.split(/[?#]/)[0] + '#e=' + encodeURIComponent(code);
const randomCode = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789', nums = new Uint8Array(12); crypto.getRandomValues(nums);
  return Array.from(nums, b => chars[b % chars.length]).join('');
};
async function publishCode(code, e) {
  if (!currentUser || !cloudReady) throw Error('Cloud not ready');
  const outcome = await window.WENV_DB.claim(code, e, currentUser.uid);
  if (!outcome) throw Error('This link name is already taken');
  return shortUrl(code);
}
async function ensureCode(e) {
  if (e.shortCode) {
    // Safe to retry publishing, especially for migrated envelopes.
    await publishCode(e.shortCode, e);
    return e.shortCode;
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = randomCode();
    if (!await window.WENV_DB.claim(code, e, currentUser.uid)) continue;
    e.shortCode = code; e.linkCodes = [...new Set([...(e.linkCodes || []), code])];
    try { await cloudPut(e) } catch (err) { console.error('Could not remember alias:', err); }
    return code;
  }
  throw Error('Could not generate a unique share link');
}
async function shareEnv(id) {
  if (!currentUser) return;
  if (!cloudReady) return toast('Connect to Firebase before sharing.');
  const e = store.find(x => x.id === id); if (!e) return toast('Envelope no longer available');
  modal(`<div class="mh"><h2>Share your envelope</h2><button class="x" aria-label="Close" onclick="closeModal()">×</button></div>
        <div class="share-studio">
          <p class="hint-small">Create a short, reusable link. Your letter and pictures stay in Firebase instead of the URL.</p>
          <label>Short link</label><div class="share-row"><input id="shareIn" readonly value="Generating link..." aria-label="Shareable short link" /><button class="btn pri" id="cp" disabled>Copy</button></div>
          <div class="share-actions"><button class="btn sec" id="nat" ${navigator.share ? '' : 'hidden'} disabled>↗ Share link</button></div>
          ${isPremium() ? `<label>✦ Rename your link (Premium)<input id="aliasInput" maxlength="32" placeholder="e.g. for-someone-special" autocomplete="off" /></label>
          <p class="hint-small">4–32 lowercase letters, numbers or hyphens. A custom name may be easier for others to guess.</p>
          <button class="btn sec wide" id="saveAlias" disabled>Save custom link name</button>
          <p class="hint-small" id="aliasStatus" role="status" aria-live="polite"></p>` : `<div class="share-locked"><strong>🔒 Custom link names are Premium</strong>
          <p>Your free plan includes a random short link. Activate Premium to create a personal link name.</p>
          <button type="button" class="btn sec" id="upgradeShareLink">✦ View Subscription</button></div>`}
          ${location.protocol === 'file:' ? '<p class="warn">Publish on Netlify or GitHub Pages. file:// links cannot be shared across devices.</p>' : ''}
        </div>`);
  let activeCode = '';
  function setLink(code) {
    activeCode = code; $('#shareIn').value = shortUrl(code); $('#cp').disabled = false;
    if ($('#nat')) $('#nat').disabled = false;
    if ($('#saveAlias')) $('#saveAlias').disabled = false;
  }
  $('#cp').onclick = async () => {
    if (!activeCode) return;
    try { await navigator.clipboard.writeText(shortUrl(activeCode)); toast('Short link copied!') }
    catch { const field = $('#shareIn'); field.focus(); field.select(); document.execCommand('copy'); toast('Link selected for copying') }
  };
  if ($('#nat')) $('#nat').onclick = () => { if (activeCode && navigator.share) navigator.share({ title: e.title, text: 'A little surprise for you 💌', url: shortUrl(activeCode) }).catch(() => { }) };
  if (isPremium()) {
    $('#aliasInput').value = e.customCode || '';
    $('#saveAlias').onclick = async () => {
      if (!isPremium()) return toast('Custom link names require Premium.');
      const input = $('#aliasInput'); const code = input.value.trim().toLowerCase().replace(/\s+/g, '-'); input.value = code;
      if (!safeCode(code)) return $('#aliasStatus').textContent = 'Use 4–32 lowercase letters, digits, or hyphens.';
      const b = $('#saveAlias'); b.disabled = true; b.textContent = 'Saving...'; $('#aliasStatus').textContent = 'Checking availability...';
      try {
        await publishCode(code, e); e.customCode = code; e.linkCodes = [...new Set([...(e.linkCodes || []), code])].slice(0, 50);
        await cloudPut(e); setLink(code); $('#aliasStatus').textContent = '✓ Custom link saved! Previous links still work.';
      } catch (err) { console.error(err); $('#aliasStatus').textContent = err.message === 'This link name is already taken' ? 'This link name is taken. Try another.' : 'Could not save custom link. Check Firebase rules.'; }
      finally { b.disabled = false; b.textContent = 'Save custom link name'; }
    };
  } else {
    $('#upgradeShareLink').onclick = () => { closeModal(); go('settings'); setSettingsPage('subscription'); };
  }
  try {
    const code = (isPremium() && e.customCode) || await ensureCode(e);
    await publishCode(code, e);
    if ($('#shareIn')) setLink(code);
  } catch (err) { console.error(err); if ($('#shareIn')) $('#shareIn').value = 'Unable to create short link'; toast('Short links need Firebase Database access. Check your rules.'); }
}


/* receiver */
let typingFrame = 0, typingToken = 0, typingFullText = '', paperTurnInProgress = false;
let paperTurnTimer = 0, paperTurnLayer = [], readerSequence = 0;
const reducedPaperMotion = () => calm || appearance.reduceMotion;
function cancelTyping() {
  ++typingToken;
  cancelAnimationFrame(typingFrame);
  typingFrame = 0;
  $('#pgTxt').classList.remove('is-typing');
  $('#skipTyping').hidden = true;
}
function finishTyping() {
  if (!$('#pgTxt').classList.contains('is-typing')) return;
  const full = typingFullText;
  cancelTyping();
  $('#pgTxt').textContent = full;
}
function clearPaperTurn() {
  ++readerSequence;
  clearTimeout(paperTurnTimer);
  for (const layer of paperTurnLayer) layer.remove();
  paperTurnLayer = [];
  paperTurnInProgress = false;
  const stage = $('#paperStage');
  stage.style.minHeight = '';
  stage.removeAttribute('aria-busy');
  $('#prev').disabled = false;
  $('#next').disabled = false;
  cancelTyping();
}
function startTypewriter(page) {
  cancelTyping();
  const txt = $('#pgTxt');
  const content = String(page?.text || '');
  typingFullText = content;
  txt.setAttribute('aria-label', content);
  const setting = safePaperMagic(recv?.paperMagic);
  if (!setting.typewriter || reducedPaperMotion() || !content) {
    txt.textContent = content;
    return;
  }
  // Unicode grapheme clusters avoid splitting emoji/combining characters mid-letter.
  const chars = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(content)].map(v => v.segment)
    : Array.from(content);
  const delay = { gentle: 58, classic: 32, quick: 13 }[setting.typingSpeed];
  const token = typingToken;
  let revealed = 0, started = 0;
  txt.textContent = '';
  txt.classList.add('is-typing');
  $('#skipTyping').hidden = false;
  const tick = timestamp => {
    if (token !== typingToken) return;
    if (!started) started = timestamp;
    const wanted = Math.min(chars.length, Math.max(1, Math.floor((timestamp - started) / delay) + 1));
    if (wanted > revealed) {
      txt.textContent += chars.slice(revealed, wanted).join('');
      revealed = wanted;
    }
    if (revealed >= chars.length) { cancelTyping(); return; }
    typingFrame = requestAnimationFrame(tick);
  };
  typingFrame = requestAnimationFrame(tick);
}

function bouquetIntroMarkup() {
  return `<div class="bouquet-intro bouquet-intro--left"><div class="bouquet-bow"></div><div class="bouquet-wrap"></div>${Array.from({ length: 8 }, (_, i) => `<span class="bouquet-flower bouquet-flower--${i + 1}"></span>`).join('')}</div><div class="bouquet-intro bouquet-intro--right"><div class="bouquet-bow"></div><div class="bouquet-wrap"></div>${Array.from({ length: 8 }, (_, i) => `<span class="bouquet-flower bouquet-flower--${i + 1}"></span>`).join('')}</div><div class="bouquet-sparkle bouquet-sparkle--1">✦</div><div class="bouquet-sparkle bouquet-sparkle--2">♡</div><div class="bouquet-sparkle bouquet-sparkle--3">✿</div><div class="bouquet-sparkle bouquet-sparkle--4">♥</div><div class="bouquet-intro-copy"><b>A flower surprise for you</b><small>the letter is blooming open...</small></div>`;
}
function hideBouquetIntro(immediate = false) {
  const overlay = $('#bouquetScreen');
  if (!overlay) return;
  clearTimeout(hideBouquetIntro.timer);
  if (immediate) {
    overlay.hidden = true;
    overlay.classList.remove('show', 'leaving');
    overlay.innerHTML = '';
    return;
  }
  overlay.classList.add('leaving');
  hideBouquetIntro.timer = setTimeout(() => {
    overlay.hidden = true;
    overlay.classList.remove('show', 'leaving');
    overlay.innerHTML = '';
  }, 720);
}
hideBouquetIntro.timer = 0;
function introVariantMarkup(style) {
  const preset = INTRO_PRESETS.find(v => v.id === safeIntroStyle(style)) || INTRO_PRESETS[0];
  if (preset.id === 'bouquet') return bouquetIntroMarkup();
  const particles = preset.particles.split(' ');
  const giant = preset.id === 'giant-heart';
  const parts = Array.from({ length: 34 }, (_, i) => {
    const angle = i * 2.399963229728653;
    const dist = 17 + Math.sqrt(i / 34) * 34;
    const x = Math.round(50 + Math.cos(angle) * dist);
    const y = Math.round(50 + Math.sin(angle) * dist);
    const dx = Math.round(Math.cos(angle) * (70 + (i % 5) * 17));
    const dy = Math.round(Math.sin(angle) * (65 + (i % 4) * 15));
    const size = 15 + (i % 4) * 8;
    return `<span class="intro-v10-particle" style="--intro-x:${Math.min(96, Math.max(4, x))}%;--intro-y:${Math.min(91, Math.max(9, y))}%;--intro-dx:${dx}px;--intro-dy:${dy}px;--intro-size:${size}px;--intro-delay:-${(i % 12) * .16}s">${particles[i % particles.length]}</span>`;
  }).join('');
  return `${parts}<div class="intro-v10-center">${giant ? '<span class="intro-giant-heart" aria-hidden="true"></span>' : `<span class="intro-v10-hero" aria-hidden="true">${preset.emoji}</span>`}<span class="intro-v10-caption">${preset.name} ♡</span></div>`;
}
function playBouquetIntro(setting, previewMode = false) {
  const overlay = $('#bouquetScreen');
  if (!overlay) return;
  if (reducedPaperMotion() || !setting?.bouquetIntro) {
    hideBouquetIntro(true);
    if (!previewMode) { $('#recvScene').classList.remove('scene-envelope-hidden'); $('#hint').style.display = ''; }
    return;
  }
  clearTimeout(hideBouquetIntro.timer);
  const preset = INTRO_PRESETS.find(v => v.id === safeIntroStyle(setting.introStyle)) || INTRO_PRESETS[0];
  overlay.className = preset.id === 'bouquet' ? 'bouquet-screen' : 'bouquet-screen intro-v10';
  overlay.removeAttribute('data-motion'); overlay.removeAttribute('data-hero-motion');
  overlay.style.removeProperty('--intro-bg1'); overlay.style.removeProperty('--intro-bg2');
  if (preset.id !== 'bouquet') {
    overlay.dataset.motion = preset.motion;
    overlay.dataset.heroMotion = preset.heroMotion;
    overlay.style.setProperty('--intro-bg1', preset.bg1);
    overlay.style.setProperty('--intro-bg2', preset.bg2);
  }
  // Keep this full-screen layer outside hidden route sections (Create preview and public reader).
  if (overlay.parentElement !== document.body) document.body.append(overlay);
  overlay.innerHTML = introVariantMarkup(preset.id) + '<button class="intro-skip" type="button" aria-label="Skip intro animation">Skip intro ›</button>';
  overlay.querySelector('.intro-skip').onclick = () => {
    ++readerSequence; hideBouquetIntro(true);
    if (!previewMode) { $('#recvScene').classList.remove('scene-envelope-hidden'); $('#hint').style.display = ''; }
  };
  overlay.hidden = false;
  overlay.classList.add('show');
  if (!previewMode) { $('#recvScene').classList.add('scene-envelope-hidden'); $('#hint').style.display = 'none'; }
  const seq = ++readerSequence;
  hideBouquetIntro.timer = setTimeout(() => {
    if (seq !== readerSequence) return;
    overlay.classList.add('leaving');
    if (!previewMode) $('#recvScene').classList.remove('scene-envelope-hidden');
    hideBouquetIntro.timer = setTimeout(() => {
      if (seq !== readerSequence) return;
      hideBouquetIntro(true);
      if (!previewMode) $('#hint').style.display = '';
    }, 650);
  }, 2250);
}
function setup(e, prev) {
  clearPaperTurn();
  recv = e; idx = 0; preview = prev; $('#recvTitle').textContent = e.title;
  $('#recvSub').textContent = e.from ? `From ${e.from}` : 'Someone prepared a little surprise for you.';
  const s = $('#recvScene'); s.className = 'scene'; s.innerHTML = `<div class="tilt">${envHTML(e.envelopeColor, e.pages.map(p => p.color), { float: 1, play: 1, id: 'recvEnv', coverText: e.coverText })}</div>`;
  $('#reader').hidden = true; $('#back').hidden = !prev; go('recv');
  playBouquetIntro(safePaperMagic(e.paperMagic));
}
function previewEnv(id) { if (!currentUser) return; const e = store.find(x => x.id === id); if (e) { closeModal(); setup(e, true); } }
function openRecv() {
  const env = $('#recvEnv'); if (!env || env.classList.contains('open')) return;
  env.classList.remove('float'); env.classList.add('open'); $('#hint').style.display = 'none'; burst(env, 18);
  const seq = ++readerSequence;
  setTimeout(() => { if (seq === readerSequence) $('#recvScene').classList.add('done'); }, 1900);
  setTimeout(() => {
    if (seq !== readerSequence) return;
    $('#recvScene').classList.add('gone'); $('#reader').hidden = false; show(0, 0);
  }, 2550);
}
function paintPage(i, animateOldStyle = 0) {
  idx = i;
  const p = recv.pages[i], el = $('#page'), last = i === recv.pages.length - 1;
  cancelTyping();
  el.style.setProperty('--paper', p.color);
  el.className = 'page' + (animateOldStyle > 0 ? ' fn' : animateOldStyle < 0 ? ' fp' : '');
  $('#pgTxt').textContent = '';
  $('#pgTxt').setAttribute('aria-label', String(p.text || ''));
  // Reserve only the height needed for this letter; avoid jumping while it types.
  const measure = $('#pgTxt').cloneNode(false);
  measure.removeAttribute('id');
  measure.textContent = String(p.text || '');
  measure.style.cssText = 'height:auto;min-height:0;max-height:none;visibility:hidden;position:absolute;pointer-events:none;white-space:pre-wrap;overflow-wrap:anywhere;overflow:visible;';
  $('#page').append(measure);
  measure.style.width = $('#pgTxt').getBoundingClientRect().width + 'px';
  const requiredHeight = Math.ceil(measure.getBoundingClientRect().height);
  measure.remove();
  $('#pgTxt').style.minHeight = Math.max(24,requiredHeight)+'px';
  $('#pgNo').textContent = `Page ${i + 1} of ${recv.pages.length}`;
  const photos = $('#pgPhotos'); photos.innerHTML = photoStackMarkup(p.photos, 'reader', i, p.photoStyle, p.photoLayout);
  photos.hidden = !(p.photos || []).length;
  $('#dots').innerHTML = recv.pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  $('#prev').style.visibility = i ? 'visible' : 'hidden'; $('#next').textContent = last ? 'Finish ♡' : 'Next ›';
  const sig = recv.signature || {};
  $('#sign').textContent = last ? (sig.text ? '— ' + sig.text : recv.from ? '— ' + recv.from : '') : '';
  $('#sign').style.fontFamily = SIGNATURE_STYLES[Number(sig.style) || 0]?.font || SIGNATURE_STYLES[0].font;
  $('#sign').style.fontStyle = (Number(sig.style) || 0) === 9 ? 'italic' : 'normal';
  $('#sign').style.textAlign = ['left', 'center', 'right'].includes(sig.align) ? sig.align : 'right';
  renderPaperEffect(p.effect || 'none');
}
function clonePaper(el, cls) {
  const copy = el.cloneNode(true);
  copy.removeAttribute('id');
  copy.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
  copy.querySelectorAll('[tabindex]').forEach(x => x.setAttribute('tabindex', '-1'));
  copy.removeAttribute('aria-busy');
  copy.setAttribute('aria-hidden', 'true');
  copy.className = 'page paper-turn-sheet ' + cls;
  copy.style.setProperty('--paper', el.style.getPropertyValue('--paper'));
  copy.inert = true;
  return copy;
}
function show(i, dir) {
  if (!recv || i < 0 || i >= recv.pages.length || paperTurnInProgress) return;
  const current = idx;
  const turn = i !== current && !!safePaperMagic(recv.paperMagic).pageTurn && !reducedPaperMotion() && !$('#reader').hidden;
  const stage = $('#paperStage'), el = $('#page');
  if (!turn) {
    paintPage(i, i === current || reducedPaperMotion() ? 0 : dir);
    startTypewriter(recv.pages[i]);
    return;
  }
  finishTyping();
  const oldHeight = el.getBoundingClientRect().height;
  const previous = clonePaper(el, 'paper-underlay');
  paintPage(i);
  const newHeight = el.getBoundingClientRect().height;
  stage.style.minHeight = Math.ceil(Math.max(oldHeight, newHeight)) + 'px';
  paperTurnInProgress = true;
  stage.setAttribute('aria-busy', 'true');
  $('#prev').disabled = $('#next').disabled = true;
  let moving;
  if (dir > 0) {
    // Turn the sheet just read. The following sheet is visible underneath.
    moving = previous;
    moving.classList.remove('paper-underlay');
    moving.classList.add('paper-turn-forward');
    stage.append(moving);
    paperTurnLayer = [moving];
  } else {
    // The sheet being returned to unfolds above the previous one.
    moving = clonePaper(el, 'paper-turn-back');
    stage.append(previous, moving);
    paperTurnLayer = [previous, moving];
  }
  const seq = ++readerSequence;
  let finished = false;
  const finalize = () => {
    if (finished || seq !== readerSequence) return;
    finished = true;
    clearTimeout(paperTurnTimer);
    paperTurnLayer.forEach(x => x.remove()); paperTurnLayer = [];
    stage.style.minHeight = ''; stage.removeAttribute('aria-busy');
    paperTurnInProgress = false;
    $('#prev').disabled = $('#next').disabled = false;
    startTypewriter(recv.pages[i]);
  };
  moving.addEventListener('animationend', e => { if (e.target === moving) finalize(); }, { once: true });
  paperTurnTimer = setTimeout(finalize, 1120);
}
function renderPaperEffect(effect) {
  const layer = $('#paperEmoji');
  layer.textContent = '';
  if (appearance.reduceMotion || !effect || effect === 'none') return;
  const icons = { hearts: ['💗', '💕', '💖'], sparkles: ['✨', '✧', '✦'], flowers: ['🌸', '🌷', '🌼'], stars: ['⭐', '🌟', '✨'], butterflies: ['🦋', '🦋', '✨'] }[effect];
  if (!icons) return;
  for (let i = 0; i < 11; i++) {
    const el = document.createElement('span'); el.className = 'emoji-particle'; el.textContent = icons[i % icons.length];
    el.style.left = `${5 + (i * 23) % 91}%`; el.style.top = `${18 + (i * 17) % 75}%`;
    el.style.animationDelay = `${i * -.43}s`; el.style.animationDuration = `${4 + (i % 3)}s`;
    layer.append(el);
  }
}
const prev = () => { if (!paperTurnInProgress && idx > 0) show(idx - 1, -1); };
function next() {
  if (!recv || paperTurnInProgress) return;
  if (idx < recv.pages.length - 1) return show(idx + 1, 1);
  finishTyping(); burst(null, 26);
  modal(`<div class="big brand-big"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><h2>That was the last page</h2><p>${recv.from ? "With love, " + esc(recv.from) : "Thanks for reading."}</p><div class="row"><button class="btn sec" onclick="closeModal();show(0,-1)">Read again</button>${preview ? '<button class="btn pri" onclick="leave()">Back to my envelopes</button>' : '<button class="btn pri" onclick="leave(1)">Make my own</button>'}</div>`)
}
function leave(c) { clearPaperTurn(); hideBouquetIntro(true); closeModal(); history.replaceState(null, '', location.pathname + location.search); recv = null; go(c ? 'create' : 'dash') }
let hashRequest = 0;
function checkHash() {
  const h = location.hash;
  if (window.WENV_ANON?.checkHash?.()) return true;
  const hasPublicLetter = h.startsWith('#e=') || h.startsWith('#envelope=');
  if (!currentUser) {
    document.body.classList.toggle('guest-receiving', hasPublicLetter);
    $('#authGate').hidden = hasPublicLetter;
    if (!hasPublicLetter) return false;
  }
  if (h.startsWith('#e=')) {
    if (!window.WENV_DB?.getPublic) return false;
    const code = decodeURIComponent(h.slice(3));
    const request = ++hashRequest;
    if (!safeCode(code)) { toast('Invalid short link'); go('home'); return true }
    clearPaperTurn(); recv = null; go('recv'); $('#recvHead').hidden = false; $('#recvTitle').textContent = 'Opening your letter...'; $('#recvSub').textContent = 'Finding your envelope in Firebase 💌';
    $('#recvScene').innerHTML = ''; hideBouquetIntro(true); $('#hint').style.display = 'none'; $('#reader').hidden = true; $('#back').hidden = true;
    window.WENV_DB.getPublic(code).then(raw => {
      if (request !== hashRequest || location.hash !== h) return;
      const obj = clean(raw && raw.envelope);
      if (!obj) { toast('This short link does not exist'); history.replaceState(null, '', location.pathname + location.search); go('home'); return }
      setup(obj, false);
      recordReceived('link-' + code, obj, code);
    }).catch(err => { if (request !== hashRequest) return; console.error(err); toast('Could not load envelope. Check internet or public-link rules.'); go('home') });
    return true;
  }
  if (!h.startsWith('#envelope=')) return false;
  const d = clean(dec(h.slice(10)));
  if (!d) { toast('This older envelope link looks broken'); go('home'); return false }
  setup(d, false); recordReceived('legacy-' + String(h).split('').reduce((v, c) => (Math.imul(v, 31) + c.charCodeAt(0)) >>> 0, 7).toString(36), d, ''); return true;
}


/* account-scoped appearance; persistence is local to this browser */
const DEFAULT_APPEARANCE = Object.freeze({ start: "#fff1f7", end: "#f4ecff", text: "#5b4260", accent: "#ee7fae", font: "nunito", size: "1", hearts: true, reduceMotion: false });
const THEMES = [
  { name: "Blush", start: "#fff1f7", end: "#f4ecff", text: "#5b4260", accent: "#ee7fae" },
  { name: "Lavender", start: "#eee6ff", end: "#dff4ff", text: "#53426d", accent: "#a389d5" },
  { name: "Peach", start: "#fff2df", end: "#ffe0eb", text: "#70475c", accent: "#e89280" },
  { name: "Mint", start: "#e9fff2", end: "#dcefff", text: "#3a6262", accent: "#71b5ab" }
];
const FONTS = { nunito: '"Nunito",system-ui,sans-serif', fredoka: '"Fredoka",system-ui,sans-serif', system: 'system-ui,sans-serif', georgia: 'Georgia,serif', trebuchet: '"Trebuchet MS",system-ui,sans-serif' };
let appearance = { ...DEFAULT_APPEARANCE }, appearanceKey = null;
function validatedAppearance(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_APPEARANCE };
  const a = { ...DEFAULT_APPEARANCE };
  for (const name of ["start", "end", "text", "accent"]) if (hexOk(raw[name])) a[name] = raw[name];
  if (Object.hasOwn(FONTS, raw.font)) a.font = raw.font;
  if (["0.92", "1", "1.1", "1.2"].includes(String(raw.size))) a.size = String(raw.size);
  if (typeof raw.hearts === "boolean") a.hearts = raw.hearts;
  if (typeof raw.reduceMotion === "boolean") a.reduceMotion = raw.reduceMotion;
  return a;
}
function loadAppearance(uid) {
  appearanceKey = "wenvcute_appearance_v2_" + uid;
  try { appearance = validatedAppearance(JSON.parse(localStorage.getItem(appearanceKey) || "null")) }
  catch { appearance = { ...DEFAULT_APPEARANCE } }
  applyAppearance();
}
function applyAppearance() {
  const root = document.documentElement.style;
  root.setProperty("--gradient-start", appearance.start);
  root.setProperty("--gradient-end", appearance.end);
  root.setProperty("--theme-ink", appearance.text);
  root.setProperty("--theme-muted", shade(appearance.text, .26));
  root.setProperty("--accent", appearance.accent);
  root.setProperty("--accent-light", shade(appearance.accent, .26));
  root.setProperty("--text-scale", appearance.size);
  root.setProperty("--ui", FONTS[appearance.font]);
  document.body.classList.toggle("no-fx", !appearance.hearts);
  document.body.classList.toggle("reduce-motion", appearance.reduceMotion);
  for (const [name, id] of [["start", "gradStart"], ["end", "gradEnd"], ["text", "textColor"], ["accent", "accentColor"]]) {
    $("#" + id).value = appearance[name]; $("#" + id + "Label").textContent = appearance[name].toUpperCase();
  }
  $("#fontChoice").value = appearance.font;
  $("#textSize").value = appearance.size;
  $("#showHearts").checked = appearance.hearts;
  renderThemePresets();
}
function changeAppearance(patch) {
  appearance = validatedAppearance({ ...appearance, ...patch });
  applyAppearance();
  if (currentUser && appearanceKey) {
    try { localStorage.setItem(appearanceKey, JSON.stringify(appearance)) }
    catch { toast("Could not save appearance preferences") }
  }
}
function renderThemePresets() {
  $("#themePresets").innerHTML = THEMES.map((t, i) => {
    const on = ["start", "end", "text", "accent"].every(k => t[k] === appearance[k]);
    return `<button type="button" class="theme-preset${on ? " on" : ""}" data-preset="${i}" aria-pressed="${on}"><span class="theme-preview" style="background:linear-gradient(135deg,${t.start},${t.end})"></span><span class="theme-label">${t.name}</span></button>`;
  }).join("");
}
function setSettingsPage(id) {
  if (id === 'account') renderAccountDashboard();
  $$(".settings-nav").forEach(b => { const on = b.dataset.settings === id; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)) });
  $$(".settings-panel").forEach(p => p.classList.toggle("on", p.id === "settings-" + id));
  // Swipeable categories remain discoverable when navigating to a panel programmatically.
  const selected = $$(".settings-nav").find(b => b.dataset.settings === id);
  if (selected && matchMedia('(max-width: 860px)').matches) {
    selected.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }
}
function updateAdminShortcut(user) {
  // UID is checked against the configured owner account; a matching email alone
  // never grants admin access. Firebase Rules are the actual security boundary.
  const ownerUid = String(window.WENV_PAYMENT?.adminUid || '').trim();
  const isOwner = Boolean(user?.uid && ownerUid && user.uid === ownerUid);
  $('#adminQuickLink').hidden = !isOwner;
}
function safePhoto(url) {
  return typeof url === "string" && /^https:\/\//i.test(url) ? url : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23f5dbea'/%3E%3Ctext x='50' y='68' text-anchor='middle' font-size='56'%3E%F0%9F%92%97%3C/text%3E%3C/svg%3E";
}
function renderUser(user) {
  const name = user.displayName || user.email?.split("@")[0] || "Envelope friend";
  $("#navName").textContent = name;
  $("#accountName").textContent = name;
  $("#accountEmail").textContent = user.email || "Signed in with Google";
  $("#accountEmailValue").textContent = user.email || "Google email unavailable";
  $("#navAvatar").src = $("#accountAvatar").src = safePhoto(user.photoURL);
}
function openAccountData() { if (!currentUser) return; go('settings'); setSettingsPage('account'); }
$('#accountNavTrigger').onclick = openAccountData;
$('#accCopyUid').onclick = async () => {
  const id = currentUser?.uid;
  if (!id) return;
  try { await navigator.clipboard.writeText(id); toast('Account ID copied securely'); }
  catch (error) { console.warn('Clipboard unavailable:', error); toast('Clipboard not available in this browser'); }
};
function authStatus(message, error = false) {
  $("#authStatus").textContent = message;
  $("#authStatus").classList.toggle("error", error);
}
function authError(error) {
  const code = error && error.code;
  const msg = ({
    "auth/popup-closed-by-user": "Sign-in window closed. Try again when you’re ready.",
    "auth/cancelled-popup-request": "The sign-in attempt was cancelled. Please try again.",
    "auth/popup-blocked": "Your browser blocked the Google popup. Allow popups or use redirect below.",
    "auth/unauthorized-domain": "This website domain must be added to Firebase Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed": "Enable Google as a sign-in provider in Firebase Authentication → Sign-in method.",
    "auth/network-request-failed": "Network problem. Check your internet connection and try again.",
    "auth/operation-not-supported-in-this-environment": "Open the site using localhost or HTTPS, not file://."
  })[code];
  authStatus(msg || "Could not sign in. Check Firebase Authentication configuration and try again.", true);
  $("#googleRedirect").hidden = !(code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment");
}
function showAuthControls() {
  const ok = !!window.WENV_AUTH.signIn;
  $("#googleSignIn").disabled = !ok;
  $("#googleButtonText").textContent = "Continue with Google";
  if (ok && !currentUser) authStatus(location.protocol === "file:" ? "Open this file via localhost or HTTPS for Google sign-in." : "Sign in with your Google account to continue.", location.protocol === "file:");
  if (location.protocol === "file:") $("#googleRedirect").hidden = true;
}
function setSignedInUser(user) {
  const oldUid = currentUser && currentUser.uid;
  currentUser = user || null;
  window.WENV_ANON?.userChanged?.(currentUser);
  updateAdminShortcut(user);
  document.body.classList.toggle('authenticated', !!user);
  const guestLink = !user && (location.hash.startsWith('#e=') || location.hash.startsWith('#envelope=') || location.hash.startsWith('#ask='));
  document.body.classList.toggle('guest-receiving', guestLink);
  $('#authGate').hidden = !!user || guestLink;
  if (!user) {
    stopCloud(); stopReceived(); stopSubscription(); stopPayments(); stopSupport(); stopFeedback(); stopCloud = stopReceived = stopSubscription = stopPayments = stopSupport = stopFeedback = () => { }; supportInbox = {}; feedbackInbox = {}; cloudReady = false; cloudConnected = false; receivedStore = []; myUsername = ''; usernameChangedAt = 0; usernameEditing = false; setUsernameLabel(); premiumApproved = false; premiumState = null; premiumPayments = []; editingId = null;
    clearPaperTurn(); accountKey = null; appearanceKey = null; store = []; recv = null; connectionUid = null;
    if (guestLink) checkHash();
    $('#googleRedirect').hidden = true;
    updateSubscriptionUI(); showAuthControls(); return;
  }
  if (oldUid !== user.uid) {
    premiumApproved = false; premiumState = null; premiumPayments = [];
    loadAccount(user.uid); loadAppearance(user.uid); renderUser(user); renderDash();
    loadMyUsername(user.uid); watchReceived(user.uid); watchPremium(user.uid); watchPayments(user.uid); watchInquiries(user.uid);
    if (window.WENV_ANON?.composing) { $('#authGate').hidden = true; }
    else if (!checkHash()) go('home');
    watchCloud(user.uid);
  }
}


window.WENV_AUTH = {
  signIn: null, signOut: null, redirect: null,
  ready(actions) { Object.assign(this, actions); showAuthControls() },
  user: setSignedInUser,
  fail(error) { $("#googleSignIn").disabled = true; authStatus("Firebase did not load. Check your connection and reload the site.", true); console.error("Firebase load failed:", error); if(location.hash.startsWith('#envelope=') || location.hash.startsWith('#ask=')) setSignedInUser(null) },
  redirectError: authError
};
$("#googleSignIn").onclick = async () => {
  if (!window.WENV_AUTH.signIn) return;
  if (location.protocol === "file:") { authStatus("Google sign-in needs localhost or an HTTPS website. Run the HTML using a local web server.", true); return }
  $("#googleSignIn").disabled = true; $("#googleButtonText").textContent = "Opening Google…"; authStatus("Choose your Google account in the popup.");
  try { await window.WENV_AUTH.signIn() }
  catch (e) { authError(e) }
  finally { $("#googleSignIn").disabled = false; $("#googleButtonText").textContent = "Continue with Google" }
};
$("#googleRedirect").onclick = async () => {
  if (location.protocol === "file:" || !window.WENV_AUTH.redirect) return;
  authStatus("Redirecting to Google…");
  try { await window.WENV_AUTH.redirect() } catch (e) { authError(e) }
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-settings]"); if (b) setSettingsPage(b.dataset.settings);
  const p = e.target.closest("[data-preset]"); if (p) changeAppearance({ ...THEMES[Number(p.dataset.preset)] });
});
for (const [id, name] of [["gradStart", "start"], ["gradEnd", "end"], ["textColor", "text"], ["accentColor", "accent"]]) {
  $("#" + id).addEventListener("input", e => changeAppearance({ [name]: e.target.value }));
}
$("#fontChoice").onchange = e => changeAppearance({ font: e.target.value });
$("#textSize").onchange = e => changeAppearance({ size: e.target.value });
$("#showHearts").onchange = e => changeAppearance({ hearts: e.target.checked });
$("#resetAppearance").onclick = () => { changeAppearance({ ...DEFAULT_APPEARANCE }); toast("Original appearance restored 💗") };
$('#premiumPlanBtn').onclick = paymentPicker;
$("#signOutBtn").onclick = () => modal(`<div class="big">👋</div><h2>Sign out?</h2><p>You can come back with the same Google account. Your envelopes will remain synced to your Google account in Firebase.</p><div class="row"><button class="btn sec" onclick="closeModal()">Stay here</button><button class="btn dng" onclick="confirmSignOut()">Sign out</button></div>`);
async function confirmSignOut() {
  closeModal();
  try { await window.WENV_AUTH.signOut() } catch { toast("Sign out failed. Please try again.") }
}
$("#exportEnvelopes").onclick = () => {
  if (!currentUser) return;
  const contents = JSON.stringify({ format: "wenvcute-backup", version: 1, exportedAt: new Date().toISOString(), envelopes: store }, null, 2);
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "w-envelope-cute-backup-" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast("Backup downloaded ♡");
};
$("#importEnvelopes").onclick = () => $("#importFile").click();
$("#importFile").onchange = async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file) return;
  if (file.size > 8 * 1024 * 1024) return toast("Backup is too large (8 MB maximum)");
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.format !== "wenvcute-backup" || !Array.isArray(data.envelopes)) throw Error("invalid format");
    const imported = data.envelopes.slice(0, 500).map(clean).filter(Boolean);
    if (!imported.length) return toast("No valid envelopes found in the backup");
    const existing = new Set(store.map(v => v.id));
    const fresh = imported.filter(v => !existing.has(v.id));
    if (!cloudReady) return toast('Cloud not connected. Try again when synced.');
    let succeeded = 0;
    for (const item of fresh) { await cloudPut(item); succeeded++ }
    toast(`${succeeded} envelopes imported to Firebase 💌`);
  } catch { toast("Could not read this envelope backup") }
};
$("#clearEnvelopes").onclick = () => {
  if (!store.length) return toast("No envelopes to delete");
  modal(`<div class="big">🗑️</div><h2>Delete all envelopes?</h2><p>This will delete ${store.length} synced envelope${store.length === 1 ? "" : "s"} from your Google account on all devices. Make a backup first if needed.</p><div class="row"><button class="btn sec" onclick="closeModal()">Cancel</button><button class="btn dng" onclick="confirmClear()">Delete all</button></div>`);
};
async function confirmClear() {
  if (!cloudReady) return toast('Cloud is unavailable');
  closeModal();
  try { await window.WENV_DB.clear(currentUser.uid); toast('All synced envelopes deleted') }
  catch (err) { console.error(err); toast('Could not clear Firebase envelopes') }
}
$("#footerYear").textContent = $("#copyrightYear").textContent = new Date().getFullYear();

/* events */
document.addEventListener("click", e => {
  const actionButton = e.target.closest('[data-envelope-action][data-envelope-id]');
  if (actionButton) {
    e.preventDefault(); e.stopPropagation();
    const { envelopeAction: action, envelopeId: id } = actionButton.dataset;
    if (action === 'view') return previewEnv(id);
    if (action === 'edit') return editEnv(id);
    if (action === 'share') return shareEnv(id);
    if (action === 'delete') return askDelete(id);
    return;
  }
  const g = e.target.closest("[data-go]"); if (g) { if (g.dataset.go === 'create' && editingId) resetLetterEditor(); if (window.WENV_ANON?.composing && g.dataset.go !== 'create') window.WENV_ANON.cancelCompose(); return go(g.dataset.go) }
  const v = e.target.closest(".env[data-play]"); if (!v) return;
  if (v.id === "recvEnv") return openRecv();
  const o = v.classList.toggle("open"); if (o) burst(v, 10)
});
document.addEventListener("pointermove", e => {
  if (calm || e.pointerType === "touch") return; const s = e.target.closest("[data-tilt]");
  if (!s || !s.firstElementChild) return; const r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  s.firstElementChild.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`
});
document.addEventListener("pointerout", e => { const s = e.target.closest && e.target.closest("[data-tilt]"); if (s && s.firstElementChild && !s.contains(e.relatedTarget)) s.firstElementChild.style.transform = "" });
addEventListener("keydown", e => {
  if (!$('#photoLightbox').hidden) {
    if (e.key === 'Escape') { e.preventDefault(); closePhotoViewer(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); movePhotoViewer(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); movePhotoViewer(-1); }
    else if (e.key === 'Tab') {
      const buttons = [$('#photoLightboxClose'), $('#photoLightboxPrev'), $('#photoLightboxNext')].filter(b => !b.disabled);
      if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === buttons[buttons.length - 1]) { e.preventDefault(); buttons[0].focus(); }
    }
    return;
  }
  if (e.key === "Escape") return closeModal();
  if (!recv || $("#reader").hidden || $("#modal").classList.contains("show") || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev()
});
let tx = 0; $("#page").addEventListener("touchstart", e => { tx = e.target.closest('.paper-photos') ? null : e.touches[0].clientX }, { passive: true });
$("#page").addEventListener("touchend", e => { if (tx === null || e.target.closest('.paper-photos')) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) d < 0 ? next() : prev() });
$("#modal").onclick = e => { if (e.target.id === "modal") closeModal() };
$("#prev").onclick = prev; $("#next").onclick = next; $("#make").onclick = create;
$('#title').oninput = updPreview;
$('#from').oninput = updateStudioCanvas;
$('#coverText').oninput = updPreview;
$('#coverUpgrade').onclick = () => { go('settings'); setSettingsPage('subscription'); };
$('#paperMagicUpgrade').onclick = () => { go('settings'); setSettingsPage('subscription'); };
$('#paperMagicTypewriter').onchange = e => { if (!isPremium()) return updatePaperMagicEditor(); paperMagic.typewriter = e.target.checked; updatePaperMagicEditor(); };
$('#paperMagicTurn').onchange = e => { if (!isPremium()) return updatePaperMagicEditor(); paperMagic.pageTurn = e.target.checked; updatePaperMagicEditor(); };
$('#paperMagicBouquet').onchange = e => { if (!isPremium()) return updatePaperMagicEditor(); paperMagic.bouquetIntro = e.target.checked; updatePaperMagicEditor(); };
$('#paperMagicSpeed').onchange = e => { if (!isPremium()) return updatePaperMagicEditor(); paperMagic.typingSpeed = ['gentle', 'classic', 'quick'].includes(e.target.value) ? e.target.value : 'classic'; updatePaperMagicEditor(); };
$('#introPreview').onclick = () => previewIntroSelection(paperMagic.introStyle, true);
$('#skipTyping').onclick = finishTyping;
$('#studioBack').onclick = () => studioMove(-1);
$('#studioNext').onclick = () => studioMove(1);
$('#studioPanelCollapse').onclick = () => studioSetCollapsed(!studioCollapsed);
$('#studioPanelScroll').addEventListener('input', () => requestAnimationFrame(updateStudioCanvas));
$('#studioPanelScroll').addEventListener('change', () => requestAnimationFrame(updateStudioCanvas));
$('#studioPanelScroll').addEventListener('click', e => { if (e.target.closest('.sw button, [data-photo-style], [data-photo-layout], [data-remove-photo], [data-intro-choice], [data-align], [data-effect]')) requestAnimationFrame(updateStudioCanvas); });
$('#studioReplayIntro').onclick = () => renderStudioIntroPreview();
// Mobile studio bottom sheet: continuous drag on header, snap shut / snap open.
// Dismissal moves the WHOLE editor-workbench, not just its content/header.
const swipeHead = $('#studioPanelHead');
const sheet = $('#editorWorkbench');
const reopenStudio = $('#studioDrawerReopen');
let studioGesture = null, skipStudioHeadClick = false;
function studioSetCollapsed(value) {
  studioCollapsed = Boolean(value);
  try { sessionStorage.setItem('wenv-mobile-studio-closed', studioCollapsed ? '1' : '0') } catch {}
  sheet.style.removeProperty('--studio-drag-y');
  sheet.classList.remove('studio-is-dragging');
  updateStudioTool();
}
function studioBegin(y) {
  if (!createWizardMobile()) return;
  studioGesture = { startY:y, lastY:y, dragged:false };
  sheet.classList.add('studio-is-dragging');
}
function studioDrag(y) {
  if (!studioGesture) return;
  const dy = y - studioGesture.startY;
  studioGesture.lastY = y;
  if (Math.abs(dy) > 5) studioGesture.dragged = true;
  // Pulling upward beyond the fully open position should not overshoot.
  sheet.style.setProperty('--studio-drag-y', Math.max(-22,Math.min(sheet.offsetHeight,dy))+'px');
}
function studioFinish(y) {
  if (!studioGesture) return;
  const dy = y - studioGesture.startY;
  const dragged = studioGesture.dragged;
  studioGesture = null;
  sheet.classList.remove('studio-is-dragging');
  if (dragged && dy > Math.min(98,sheet.offsetHeight*.21)) studioSetCollapsed(true);
  else studioSetCollapsed(studioCollapsed); // cancelled gesture retains previous state
  if (dragged) {skipStudioHeadClick=true;setTimeout(()=>{skipStudioHeadClick=false},0)}
}
swipeHead.addEventListener('pointerdown',e => {
  if (!createWizardMobile() || e.target.closest('button') || !e.isPrimary) return;
  studioBegin(e.clientY);
  try {swipeHead.setPointerCapture(e.pointerId)} catch (_) {}
});
swipeHead.addEventListener('pointermove',e => {if(studioGesture) studioDrag(e.clientY)});
swipeHead.addEventListener('pointerup',e => {if(studioGesture) studioFinish(e.clientY)});
swipeHead.addEventListener('pointercancel',()=> {studioGesture=null;sheet.classList.remove('studio-is-dragging');sheet.style.removeProperty('--studio-drag-y')});
swipeHead.addEventListener('click',e => {
  if (!createWizardMobile() || e.target.closest('button') || skipStudioHeadClick) return;
  studioSetCollapsed(!studioCollapsed);
});
// Pull down at the top of editor content (outside buttons/fields) to close.
const scrollPanel = $('#studioPanelScroll');
let panelPull = null;
scrollPanel.addEventListener('touchstart',e => {
  if (!createWizardMobile() || e.touches.length !== 1 || studioCollapsed ||
      e.target.closest('input,textarea,select,button,[contenteditable],.polaroid-options,.intro-choice-grid')) return;
  panelPull = {x:e.touches[0].clientX,y:e.touches[0].clientY,atTop:scrollPanel.scrollTop<=2,dragging:false};
},{passive:true});
scrollPanel.addEventListener('touchmove',e=>{
  if(!panelPull || !panelPull.atTop || e.touches.length!==1) return;
  const dy=e.touches[0].clientY-panelPull.y,dx=e.touches[0].clientX-panelPull.x;
  if(dy>12 && Math.abs(dy)>Math.abs(dx)*1.4){
    panelPull.dragging=true;
    e.preventDefault();
    sheet.classList.add('studio-is-dragging');
    sheet.style.setProperty('--studio-drag-y',Math.min(sheet.offsetHeight,dy)+'px');
  }
},{passive:false});
scrollPanel.addEventListener('touchend',e=>{
  if(!panelPull)return;
  const dy=e.changedTouches[0].clientY-panelPull.y;
  const shouldClose=panelPull.dragging && dy>Math.min(110,sheet.offsetHeight*.24);
  panelPull=null;
  sheet.classList.remove('studio-is-dragging');
  studioSetCollapsed(shouldClose || studioCollapsed);
},{passive:true});
scrollPanel.addEventListener('touchcancel',()=>{panelPull=null;sheet.classList.remove('studio-is-dragging');sheet.style.removeProperty('--studio-drag-y')});
// Visible reopening grip remains outside of the closed drawer.
reopenStudio.addEventListener('click',()=>studioSetCollapsed(false));
let reopenY=null, reopenTravel=0;
reopenStudio.addEventListener('touchstart',e=>{
  if(!createWizardMobile() || !studioCollapsed)return;
  reopenY=e.touches[0]?.clientY??null;
  reopenTravel=0;
  if(reopenY===null)return;
  sheet.classList.remove('studio-is-collapsed');
  sheet.classList.add('studio-is-dragging');
  sheet.style.setProperty('--studio-drag-y',(sheet.offsetHeight+125)+'px');
},{passive:true});
reopenStudio.addEventListener('touchmove',e=>{
  if(reopenY===null || e.touches.length!==1)return;
  reopenTravel=reopenY-e.touches[0].clientY;
  sheet.style.setProperty('--studio-drag-y',Math.max(0,sheet.offsetHeight+125-Math.max(0,reopenTravel)*2.3)+'px');
  if(reopenTravel>8)e.preventDefault();
},{passive:false});
reopenStudio.addEventListener('touchend',()=>{
  if(reopenY===null)return;
  const open=reopenTravel>45;
  reopenY=null;
  reopenTravel=0;
  studioSetCollapsed(!open);
},{passive:true});
reopenStudio.addEventListener('touchcancel',()=>{
  reopenY=null;reopenTravel=0;studioSetCollapsed(true);
},{passive:true});
addEventListener('resize', () => applyCreateWizard());
$('#count').onchange = () => { activeLetterPage = 0; renderPages(); updPreview(); };
$('#letterPageTabs').addEventListener('scroll', updatePageTabArrows, { passive: true });
$('#letterPageLeft').onclick = () => $('#letterPageTabs').scrollBy({ left: -$('#letterPageTabs').clientWidth * .75, behavior: 'smooth' });
$('#letterPageRight').onclick = () => $('#letterPageTabs').scrollBy({ left: $('#letterPageTabs').clientWidth * .75, behavior: 'smooth' });
$('#signatureText').oninput = renderSignatureStyles;
addEventListener("hashchange", checkHash);

/* Expiration checks use the same stored Firebase expiry; no background writes. */
let lastPremiumActive = false;
setInterval(() => {
  if (!currentUser || !premiumState) return;
  const active = isPremium();
  if (active !== lastPremiumActive) {lastPremiumActive=active;updateSubscriptionUI()}
  else if (active) {
    $('#premiumAccountStatus').textContent = `✓ Premium active · ${premiumLeftText(premiumRemaining())} remaining · until ${new Date(premiumState.expiresAt).toLocaleString('en-PH')}`;
    $('#accPremiumDetail').textContent = 'Active · ' + premiumLeftText(premiumRemaining()) + ' remaining';
  }
},1000);

/* init */
const bg = $("#bg"); for (let i = 0; i < 9; i++) {
  const s = document.createElement("i"); s.textContent = ["♡", "✦", "♥", "✧"][i % 4];
  s.style.cssText = `left:${(i * 37 + 8) % 96}%;top:${(i * 53 + 10) % 88}%;font-size:${14 + i % 4 * 8}px;animation-delay:${-i * 1.3}s;animation-duration:${9 + i % 4 * 3}s`; bg.append(s)
}
updatePageOptions(); $('#count').value = '1';
renderColorPalettes();
applyCreateWizard();
$("#demo").innerHTML = envHTML(ENV[0], PAPER.slice(0, 3), { float: 1, play: 1 });
$("#pvEnv").innerHTML = envHTML(envColor, [paper], { play: 1 });
renderPages(); renderSignatureStyles(); updatePaperMagicEditor(); renderDash();
// Firebase observer decides when the app becomes visible and which account owns local data.
