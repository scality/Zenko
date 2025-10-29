const { getPreviousTag } = require('../../.github/scripts/get-previous-tag');

it('should return undefined when no tag', async () => {
  const tag = getPreviousTag("1.0.0", []);
  expect(tag).toBeUndefined()
});

it('should return the previous tag', async () => {
  const tag = getPreviousTag("1.2.1", [
    { tag_name: "1.1.0" }, { tag_name: "1.1.1" }, { tag_name: "1.1.2" },
    { tag_name: "1.2.0" }, { tag_name: "1.3.0" }
  ]);
  expect(tag).toBe("1.2.0");
});

it('should return the previous tag out of order', async () => {
  const tag = getPreviousTag("1.2.1", [
    { tag_name: "1.1.2" }, { tag_name: "1.2.0" }, { tag_name: "1.1.1" },
    { tag_name: "1.1.0" }, { tag_name: "1.3.0" }
  ]);
  expect(tag).toBe("1.2.0");
});

it('should return previous tag when > 10', async () => {
  const tag = getPreviousTag("1.1.12", [
    { tag_name: "1.1.0" }, { tag_name: "1.1.1" }, { tag_name: "1.1.2" },
    { tag_name: "1.1.3" }, { tag_name: "1.1.4" }, { tag_name: "1.1.5" },
    { tag_name: "1.1.6" }, { tag_name: "1.1.7" }, { tag_name: "1.1.8" },
    { tag_name: "1.1.9" }, { tag_name: "1.1.10" }, { tag_name: "1.1.11" }, 
    { tag_name: "1.2.0" }, { tag_name: "1.3.0" }
  ]);
  expect(tag).toBe("1.1.11");
});

it('should return the previous rc tag', async () => {
  const tag = getPreviousTag("1.2.1-rc.2", [
    { tag_name: "1.1.0" }, { tag_name: "1.1.1" }, { tag_name: "1.1.2-rc.1" },
    { tag_name: "1.1.2-rc.2" }, { tag_name: "1.1.2" }, { tag_name: "1.2.0" },
    { tag_name: "1.2.1-rc.1" }, { tag_name: "1.3.0" }
  ]);
  expect(tag).toBe("1.2.1-rc.1");
});

it('should return the previous tag on first rc', async () => {
  const tag = getPreviousTag("1.2.1-rc.2", [
    { tag_name: "1.1.0" }, { tag_name: "1.1.1" }, { tag_name: "1.1.2-rc.1" },
    { tag_name: "1.1.2-rc.2" }, { tag_name: "1.1.2" }, { tag_name: "1.2.0" },
    { tag_name: "1.3.0" }
  ]);
  expect(tag).toBe("1.2.0");
});
