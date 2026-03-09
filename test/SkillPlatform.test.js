/**
 * test/SkillPlatform.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Basic Truffle / Mocha tests for SkillPlatform.sol.
 * Run: truffle test --network development
 */

const SkillPlatform = artifacts.require("SkillPlatform");

contract("SkillPlatform", (accounts) => {
  const owner   = accounts[0];   // contract deployer + default minter
  const mentor  = accounts[1];
  const learner = accounts[2];
  const stranger = accounts[3];

  let platform;

  beforeEach(async () => {
    platform = await SkillPlatform.new({ from: owner });
  });

  // ════════════════════════════════════════════════════════════════════
  //  NFT CERTIFICATE TESTS
  // ════════════════════════════════════════════════════════════════════

  describe("mintCertificate()", () => {
    it("owner can mint a certificate", async () => {
      const tx = await platform.mintCertificate(
        learner,
        "course_001",
        "React Fundamentals",
        "Alice Mentor",
        "ipfs://QmTestMetadata",
        { from: owner }
      );

      const event = tx.logs[1]; // Transfer + CertificateMinted
      const certEvent = tx.logs.find(l => l.event === "CertificateMinted");
      assert.ok(certEvent, "CertificateMinted event not emitted");
      assert.equal(certEvent.args.learner, learner);
      assert.equal(certEvent.args.courseId, "course_001");
    });

    it("tokenId starts at 1", async () => {
      const tx = await platform.mintCertificate(
        learner, "c1", "Course 1", "Mentor", "ipfs://Qm1", { from: owner }
      );
      const certEvent = tx.logs.find(l => l.event === "CertificateMinted");
      assert.equal(certEvent.args.tokenId.toString(), "1");
    });

    it("blocks duplicate certificate for same learner + courseId", async () => {
      await platform.mintCertificate(learner, "c1", "Course 1", "Mentor", "ipfs://Qm1", { from: owner });
      try {
        await platform.mintCertificate(learner, "c1", "Course 1", "Mentor", "ipfs://Qm2", { from: owner });
        assert.fail("should have reverted");
      } catch (err) {
        assert.include(err.message, "already issued");
      }
    });

    it("stranger cannot mint without minter role", async () => {
      try {
        await platform.mintCertificate(learner, "c2", "Course 2", "M", "ipfs://Qm3", { from: stranger });
        assert.fail("should have reverted");
      } catch (err) {
        assert.include(err.message, "not an authorized minter");
      }
    });

    it("setMinter grants minting rights to a new address", async () => {
      await platform.setMinter(stranger, true, { from: owner });
      const tx = await platform.mintCertificate(
        learner, "c3", "Course 3", "M", "ipfs://Qm4", { from: stranger }
      );
      assert.ok(tx.logs.find(l => l.event === "CertificateMinted"));
    });

    it("certificate is soulbound — transfer reverts", async () => {
      await platform.mintCertificate(learner, "c4", "Course 4", "M", "ipfs://Qm5", { from: owner });
      try {
        await platform.transferFrom(learner, stranger, 1, { from: learner });
        assert.fail("should have reverted");
      } catch (err) {
        assert.include(err.message, "soulbound");
      }
    });

    it("verifyCertificate returns correct data", async () => {
      await platform.mintCertificate(
        learner, "c5", "Node.js Mastery", "Bob Mentor", "ipfs://QmVerify", { from: owner }
      );
      const result = await platform.verifyCertificate(1);
      assert.equal(result.learner,     learner);
      assert.equal(result.courseId,    "c5");
      assert.equal(result.courseName,  "Node.js Mastery");
      assert.equal(result.mentorName,  "Bob Mentor");
      assert.equal(result.metadataURI, "ipfs://QmVerify");
    });

    it("getCertificateTokenId returns 0 if not issued", async () => {
      const id = await platform.getCertificateTokenId(learner, "notissued");
      assert.equal(id.toString(), "0");
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  SESSION BOOKING TESTS
  // ════════════════════════════════════════════════════════════════════

  describe("createSession() + bookSession()", () => {
    const SESSION_ID  = "mongo_session_abc123";
    const PRICE_WEI   = web3.utils.toWei("0.01", "ether");
    const FUTURE_TIME = Math.floor(Date.now() / 1000) + 86400; // +1 day

    it("mentor can register a session", async () => {
      const tx = await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      const ev = tx.logs.find(l => l.event === "SessionCreated");
      assert.ok(ev, "SessionCreated event not emitted");
      assert.equal(ev.args.mentor, mentor);
    });

    it("session is active and has correct price", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      const s = await platform.getSession(SESSION_ID);
      assert.equal(s.mentor,   mentor);
      assert.equal(s.priceWei, PRICE_WEI);
      assert.equal(s.isActive, true);
    });

    it("learner books session by sending exact ETH", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      const tx = await platform.bookSession(SESSION_ID, FUTURE_TIME, {
        from: learner, value: PRICE_WEI
      });
      const ev = tx.logs.find(l => l.event === "SessionBooked");
      assert.ok(ev);
      assert.equal(ev.args.learner, learner);
      assert.equal(ev.args.mentor,  mentor);
      assert.equal(ev.args.amountPaid.toString(), PRICE_WEI);
    });

    it("session becomes inactive after booking", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      await platform.bookSession(SESSION_ID, FUTURE_TIME, { from: learner, value: PRICE_WEI });
      const s = await platform.getSession(SESSION_ID);
      assert.equal(s.isActive, false);
    });

    it("booking fails with wrong ETH amount", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      try {
        await platform.bookSession(SESSION_ID, FUTURE_TIME, {
          from: learner, value: web3.utils.toWei("0.005", "ether")
        });
        assert.fail("should have reverted");
      } catch (err) {
        assert.include(err.message, "incorrect ETH amount");
      }
    });

    it("mentor cannot book own session", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      try {
        await platform.bookSession(SESSION_ID, FUTURE_TIME, { from: mentor, value: PRICE_WEI });
        assert.fail("should have reverted");
      } catch (err) {
        assert.include(err.message, "mentor cannot book own session");
      }
    });
  });

  describe("confirmSession()", () => {
    const SESSION_ID  = "session_confirm_test";
    const PRICE_WEI   = web3.utils.toWei("0.01", "ether");
    const FUTURE_TIME = Math.floor(Date.now() / 1000) + 86400;

    it("mentor receives ETH minus 2% platform fee on confirm", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      await platform.bookSession(SESSION_ID, FUTURE_TIME, { from: learner, value: PRICE_WEI });

      const mentorBefore = BigInt(await web3.eth.getBalance(mentor));
      const tx = await platform.confirmSession(1, { from: mentor });
      const gasUsed = BigInt(tx.receipt.gasUsed);
      const gasPrice = BigInt((await web3.eth.getTransaction(tx.tx)).gasPrice);
      const mentorAfter = BigInt(await web3.eth.getBalance(mentor));

      // payout = 0.01 ETH × 98% = 0.0098 ETH
      const expectedPayout = BigInt(PRICE_WEI) * 98n / 100n;
      const actual = mentorAfter - mentorBefore + gasUsed * gasPrice;
      assert.equal(actual.toString(), expectedPayout.toString());
    });

    it("platform fee is accumulated", async () => {
      await platform.createSession(SESSION_ID + "_2", PRICE_WEI, { from: mentor });
      await platform.bookSession(SESSION_ID + "_2", FUTURE_TIME, { from: learner, value: PRICE_WEI });
      await platform.confirmSession(1, { from: mentor });

      const fees = await platform.accumulatedFees();
      const expected = BigInt(PRICE_WEI) * 2n / 100n;
      assert.equal(fees.toString(), expected.toString());
    });
  });

  describe("cancelSession()", () => {
    const SESSION_ID  = "session_cancel_test";
    const PRICE_WEI   = web3.utils.toWei("0.01", "ether");
    const FUTURE_TIME = Math.floor(Date.now() / 1000) + 86400;

    it("learner gets full refund on cancel", async () => {
      await platform.createSession(SESSION_ID, PRICE_WEI, { from: mentor });
      await platform.bookSession(SESSION_ID, FUTURE_TIME, { from: learner, value: PRICE_WEI });

      const learnerBefore = BigInt(await web3.eth.getBalance(learner));
      const tx = await platform.cancelSession(1, { from: learner });
      const gasUsed = BigInt(tx.receipt.gasUsed);
      const gasPrice = BigInt((await web3.eth.getTransaction(tx.tx)).gasPrice);
      const learnerAfter = BigInt(await web3.eth.getBalance(learner));

      const actual = learnerAfter - learnerBefore + gasUsed * gasPrice;
      assert.equal(actual.toString(), PRICE_WEI.toString());
    });

    it("session slot re-opens after cancel", async () => {
      await platform.createSession(SESSION_ID + "_ro", PRICE_WEI, { from: mentor });
      await platform.bookSession(SESSION_ID + "_ro", FUTURE_TIME, { from: learner, value: PRICE_WEI });
      await platform.cancelSession(1, { from: learner });
      const s = await platform.getSession(SESSION_ID + "_ro");
      assert.equal(s.isActive, true);
    });

    it("stranger cannot cancel", async () => {
      await platform.createSession(SESSION_ID + "_str", PRICE_WEI, { from: mentor });
      await platform.bookSession(SESSION_ID + "_str", FUTURE_TIME, { from: learner, value: PRICE_WEI });
      try {
        await platform.cancelSession(1, { from: stranger });
        assert.fail("should have reverted");
      } catch (err) {
        assert.include(err.message, "not authorized to cancel");
      }
    });
  });
});
