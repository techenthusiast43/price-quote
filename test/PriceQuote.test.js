const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PriceQuote Contract", function () {
  let priceQuote;
  let owner;
  let freelancer;
  let client;
  let unauthorizedWallet;

  const sampleDocHash = ethers.keccak256(ethers.toUtf8Bytes("PriceQuote-Proposal-Sample-v1"));
  const sampleDocUri = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const amount = 250000; // e.g. $2,500.00 (in cents)
  const currency = "USD";

  beforeEach(async function () {
    [owner, freelancer, client, unauthorizedWallet] = await ethers.getSigners();

    const PriceQuoteFactory = await ethers.getContractFactory("PriceQuote");
    priceQuote = await PriceQuoteFactory.deploy();
    await priceQuote.waitForDeployment();
  });

  describe("Quotation Creation", function () {
    it("should allow any wallet to create a quotation and increment ID", async function () {
      const now = await time.latest();
      const expiry = now + 86400 * 7; // 7 days ahead

      const tx = await priceQuote.connect(freelancer).createQuotation(
        client.address,
        amount,
        currency,
        expiry,
        sampleDocHash,
        sampleDocUri
      );

      await expect(tx)
        .to.emit(priceQuote, "QuotationCreated")
        .withArgs(
          1,
          freelancer.address,
          client.address,
          amount,
          currency,
          expiry,
          sampleDocHash,
          sampleDocUri,
          (val) => val > 0
        );

      expect(await priceQuote.getTotalQuotations()).to.equal(1);

      const q = await priceQuote.getQuotation(1);
      expect(q.id).to.equal(1);
      expect(q.creator).to.equal(freelancer.address);
      expect(q.client).to.equal(client.address);
      expect(q.amount).to.equal(amount);
      expect(q.currency).to.equal(currency);
      expect(q.expiryTimestamp).to.equal(expiry);
      expect(q.documentHash).to.equal(sampleDocHash);
      expect(q.docUri).to.equal(sampleDocUri);
      expect(q.status).to.equal(0); // Status 0 = Pending
    });

    it("should reject creation if client is zero address", async function () {
      const now = await time.latest();
      const expiry = now + 86400;

      await expect(
        priceQuote.connect(freelancer).createQuotation(
          ethers.ZeroAddress,
          amount,
          currency,
          expiry,
          sampleDocHash,
          sampleDocUri
        )
      ).to.be.revertedWith("PriceQuote: Invalid client address");
    });

    it("should reject creation if creator is client", async function () {
      const now = await time.latest();
      const expiry = now + 86400;

      await expect(
        priceQuote.connect(freelancer).createQuotation(
          freelancer.address,
          amount,
          currency,
          expiry,
          sampleDocHash,
          sampleDocUri
        )
      ).to.be.revertedWith("PriceQuote: Creator cannot be client");
    });

    it("should reject creation if amount is zero", async function () {
      const now = await time.latest();
      const expiry = now + 86400;

      await expect(
        priceQuote.connect(freelancer).createQuotation(
          client.address,
          0,
          currency,
          expiry,
          sampleDocHash,
          sampleDocUri
        )
      ).to.be.revertedWith("PriceQuote: Amount must be greater than zero");
    });

    it("should reject creation if currency is empty", async function () {
      const now = await time.latest();
      const expiry = now + 86400;

      await expect(
        priceQuote.connect(freelancer).createQuotation(
          client.address,
          amount,
          "",
          expiry,
          sampleDocHash,
          sampleDocUri
        )
      ).to.be.revertedWith("PriceQuote: Invalid currency code");
    });

    it("should reject creation if expiry is not in the future", async function () {
      const now = await time.latest();

      await expect(
        priceQuote.connect(freelancer).createQuotation(
          client.address,
          amount,
          currency,
          now - 10,
          sampleDocHash,
          sampleDocUri
        )
      ).to.be.revertedWith("PriceQuote: Expiry must be in the future");
    });

    it("should reject creation if document hash is zero", async function () {
      const now = await time.latest();
      const expiry = now + 86400;

      await expect(
        priceQuote.connect(freelancer).createQuotation(
          client.address,
          amount,
          currency,
          expiry,
          ethers.ZeroHash,
          sampleDocUri
        )
      ).to.be.revertedWith("PriceQuote: Document hash required");
    });
  });

  describe("Quotation Acceptance", function () {
    let quoteId;
    let expiry;

    beforeEach(async function () {
      const now = await time.latest();
      expiry = now + 86400 * 3;

      const tx = await priceQuote.connect(freelancer).createQuotation(
        client.address,
        amount,
        currency,
        expiry,
        sampleDocHash,
        sampleDocUri
      );
      const receipt = await tx.wait();
      quoteId = 1;
    });

    it("should allow only the assigned client to accept quotation", async function () {
      const tx = await priceQuote.connect(client).acceptQuotation(quoteId);

      await expect(tx)
        .to.emit(priceQuote, "QuotationAccepted")
        .withArgs(quoteId, client.address, (val) => val > 0);

      const q = await priceQuote.getQuotation(quoteId);
      expect(q.status).to.equal(1); // 1 = Accepted
    });

    it("should revert when non-client tries to accept", async function () {
      await expect(
        priceQuote.connect(unauthorizedWallet).acceptQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Only assigned client can accept");

      await expect(
        priceQuote.connect(freelancer).acceptQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Only assigned client can accept");
    });

    it("should revert when accepting an expired quotation", async function () {
      // Fast forward past expiry
      await time.increaseTo(expiry + 10);

      await expect(
        priceQuote.connect(client).acceptQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Quotation has expired");
    });

    it("should revert when accepting an already accepted quotation", async function () {
      await priceQuote.connect(client).acceptQuotation(quoteId);

      await expect(
        priceQuote.connect(client).acceptQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Quotation is not pending");
    });
  });

  describe("Quotation Rejection", function () {
    let quoteId;

    beforeEach(async function () {
      const now = await time.latest();
      const tx = await priceQuote.connect(freelancer).createQuotation(
        client.address,
        amount,
        currency,
        now + 86400,
        sampleDocHash,
        sampleDocUri
      );
      await tx.wait();
      quoteId = 1;
    });

    it("should allow only assigned client to reject quotation with a reason", async function () {
      const reason = "Budget exceeds allocated funds for this quarter.";
      const tx = await priceQuote.connect(client).rejectQuotation(quoteId, reason);

      await expect(tx)
        .to.emit(priceQuote, "QuotationRejected")
        .withArgs(quoteId, client.address, reason, (val) => val > 0);

      const q = await priceQuote.getQuotation(quoteId);
      expect(q.status).to.equal(2); // 2 = Rejected
      expect(q.rejectReason).to.equal(reason);
    });

    it("should revert when non-client attempts to reject", async function () {
      await expect(
        priceQuote.connect(freelancer).rejectQuotation(quoteId, "Unauthorized")
      ).to.be.revertedWith("PriceQuote: Only assigned client can reject");
    });

    it("should revert if rejecting already rejected quotation", async function () {
      await priceQuote.connect(client).rejectQuotation(quoteId, "First reject");

      await expect(
        priceQuote.connect(client).rejectQuotation(quoteId, "Second reject")
      ).to.be.revertedWith("PriceQuote: Quotation is not pending");
    });
  });

  describe("Quotation Cancellation", function () {
    let quoteId;

    beforeEach(async function () {
      const now = await time.latest();
      const tx = await priceQuote.connect(freelancer).createQuotation(
        client.address,
        amount,
        currency,
        now + 86400,
        sampleDocHash,
        sampleDocUri
      );
      await tx.wait();
      quoteId = 1;
    });

    it("should allow only creator to cancel pending quotation", async function () {
      const tx = await priceQuote.connect(freelancer).cancelQuotation(quoteId);

      await expect(tx)
        .to.emit(priceQuote, "QuotationCancelled")
        .withArgs(quoteId, freelancer.address, (val) => val > 0);

      const q = await priceQuote.getQuotation(quoteId);
      expect(q.status).to.equal(3); // 3 = Cancelled
    });

    it("should revert if client or third party tries to cancel", async function () {
      await expect(
        priceQuote.connect(client).cancelQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Only creator can cancel");

      await expect(
        priceQuote.connect(unauthorizedWallet).cancelQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Only creator can cancel");
    });

    it("should not allow client to accept a cancelled quotation", async function () {
      await priceQuote.connect(freelancer).cancelQuotation(quoteId);

      await expect(
        priceQuote.connect(client).acceptQuotation(quoteId)
      ).to.be.revertedWith("PriceQuote: Quotation is not pending");
    });
  });

  describe("Queries and Indexing", function () {
    it("should correctly index creator and client quotations", async function () {
      const now = await time.latest();

      await priceQuote.connect(freelancer).createQuotation(
        client.address,
        1000,
        "USD",
        now + 86400,
        sampleDocHash,
        ""
      );

      await priceQuote.connect(freelancer).createQuotation(
        client.address,
        2000,
        "EUR",
        now + 86400,
        sampleDocHash,
        ""
      );

      await priceQuote.connect(owner).createQuotation(
        freelancer.address,
        3000,
        "tBOT",
        now + 86400,
        sampleDocHash,
        ""
      );

      const freelancerCreated = await priceQuote.getQuotationsByCreator(freelancer.address);
      expect(freelancerCreated.length).to.equal(2);
      expect(freelancerCreated[0]).to.equal(1);
      expect(freelancerCreated[1]).to.equal(2);

      const clientReceived = await priceQuote.getQuotationsByClient(client.address);
      expect(clientReceived.length).to.equal(2);

      const freelancerAll = await priceQuote.getQuotationsForWallet(freelancer.address);
      // Created 2 (1, 2) and received 1 (3)
      expect(freelancerAll.length).to.equal(3);

      const batch = await priceQuote.getQuotationsBatch([1, 2, 3]);
      expect(batch.length).to.equal(3);
      expect(batch[0].amount).to.equal(1000);
      expect(batch[1].amount).to.equal(2000);
      expect(batch[2].amount).to.equal(3000);
    });
  });
});

