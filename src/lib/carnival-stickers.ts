export const carnivalStickers = [
  {
    "id": "hearts",
    "name": "Love",
    "src": "/karnaval/stickers/hearts.png"
  },
  {
    "id": "rings",
    "name": "Wedding rings",
    "src": "/karnaval/stickers/rings.png"
  },
  {
    "id": "cheers",
    "name": "Cheers",
    "src": "/karnaval/stickers/cheers.png"
  },
  {
    "id": "cake",
    "name": "Wedding cake",
    "src": "/karnaval/stickers/cake.png"
  },
  {
    "id": "dancing-celebration-86cd222f",
    "name": "Dancing celebration",
    "src": "/karnaval/stickers/dancing-celebration-86cd222f.gif"
  },
  {
    "id": "quby-cheering-2590833d",
    "name": "Quby cheering",
    "src": "/karnaval/stickers/quby-cheering-2590833d.gif"
  },
  {
    "id": "animated-wish-1-e48f1a48",
    "name": "Animated wish 1",
    "src": "/karnaval/stickers/animated-wish-1-e48f1a48.gif"
  },
  {
    "id": "animated-wish-2-4ba9113d",
    "name": "Animated wish 2",
    "src": "/karnaval/stickers/animated-wish-2-4ba9113d.gif"
  },
  {
    "id": "animated-wish-3-53c4dc87",
    "name": "Animated wish 3",
    "src": "/karnaval/stickers/animated-wish-3-53c4dc87.gif"
  },
  {
    "id": "animated-wish-4-4a8d624d",
    "name": "Animated wish 4",
    "src": "/karnaval/stickers/animated-wish-4-4a8d624d.gif"
  },
  {
    "id": "dudu-wave-f594b9d1",
    "name": "Dudu wave",
    "src": "/karnaval/stickers/dudu-wave-f594b9d1.gif"
  },
  {
    "id": "bubu-dudu-greeting-262efa08",
    "name": "Bubu Dudu greeting",
    "src": "/karnaval/stickers/bubu-dudu-greeting-262efa08.gif"
  },
  {
    "id": "dudu-twisting-dance-1ee32361",
    "name": "Dudu twisting dance",
    "src": "/karnaval/stickers/dudu-twisting-dance-1ee32361.gif"
  },
  {
    "id": "happy-birthday-c9753492",
    "name": "Happy birthday",
    "src": "/karnaval/stickers/happy-birthday-c9753492.gif"
  },
  {
    "id": "bubu-dudu-celebration-0972266b",
    "name": "Bubu Dudu celebration",
    "src": "/karnaval/stickers/bubu-dudu-celebration-0972266b.gif"
  },
  {
    "id": "cute-bear-1a61618e",
    "name": "Cute bear",
    "src": "/karnaval/stickers/cute-bear-1a61618e.gif"
  },
  {
    "id": "animated-wish-5-2c364bb3",
    "name": "Animated wish 5",
    "src": "/karnaval/stickers/animated-wish-5-2c364bb3.gif"
  },
  {
    "id": "weird-reaction-b9177f5d",
    "name": "Weird reaction",
    "src": "/karnaval/stickers/weird-reaction-b9177f5d.gif"
  },
  {
    "id": "animated-wish-6-67b768c9",
    "name": "Animated wish 6",
    "src": "/karnaval/stickers/animated-wish-6-67b768c9.gif"
  },
  {
    "id": "scuba-cat-cc46b684",
    "name": "Scuba cat",
    "src": "/karnaval/stickers/scuba-cat-cc46b684.gif"
  },
  {
    "id": "animated-wish-7-48cee2f1",
    "name": "Animated wish 7",
    "src": "/karnaval/stickers/animated-wish-7-48cee2f1.gif"
  },
  {
    "id": "animated-wish-8-f86a127a",
    "name": "Animated wish 8",
    "src": "/karnaval/stickers/animated-wish-8-f86a127a.gif"
  },
  {
    "id": "crying-kitten-534970e5",
    "name": "Crying kitten",
    "src": "/karnaval/stickers/crying-kitten-534970e5.gif"
  },
  {
    "id": "quby-sticker-21eccc42",
    "name": "Quby sticker",
    "src": "/karnaval/stickers/quby-sticker-21eccc42.gif"
  },
  {
    "id": "revenk-d7320d67",
    "name": "Revenk",
    "src": "/karnaval/stickers/revenk-d7320d67.gif"
  }
] as const;
export const stickerImage = (id:string) => carnivalStickers.find(s=>s.id===id)?.src;
export const validSticker = (id:string) => ["❤️","💍","🥂","🎂","🎉"].includes(id) || carnivalStickers.some(s=>s.id===id);
