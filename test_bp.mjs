import sharp from 'sharp'
const svg='<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" fill="#1a1815"/><rect width="800" height="800" fill="rgba(212,162,76,0.08)"/><text x="400" y="440" font-family="Anton, sans-serif" font-size="280" fill="#D4A24C" text-anchor="middle" dominant-baseline="middle">BP</text></svg>'
try{
  const buf=await sharp(Buffer.from(svg)).jpeg({quality:82}).toBuffer()
  console.log('ok', buf.length)
}catch(e){ console.error('err', e.message) }
