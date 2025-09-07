async function invalidateCache(req, input) {
  if (input) {
    const key = `post:${input}`;
    await req.redis.del(key);
  }
  //the keys that are start with posts have be get from redis and delete all
  const keys = await req.redis.keys("post:*");
  if (keys.length > 0) {
    await req.redis.del(keys);
  }
}

module.exports = { invalidateCache };
