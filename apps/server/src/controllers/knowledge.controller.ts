import { Request, Response } from 'express';
import {
  GuidelineRepository,
  FactRepository,
  TerminologyRepository,
  inMemoryDb
} from '@inkloom/database';
import { GuidelineIndexer, FactIndexer } from '@inkloom/vector-store';

export class KnowledgeController {
  public static async getGuidelines(req: Request, res: Response): Promise<void> {
    try {
      const data = await GuidelineRepository.getAll();
      res.json({ success: true, guidelines: data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async addGuideline(req: Request, res: Response): Promise<void> {
    try {
      const { title, category, content } = req.body;
      const created = await GuidelineRepository.create({
        orgId: 'org_inkloom_01',
        title,
        category,
        content,
        version: 1,
        isActive: true
      });
      await GuidelineIndexer.indexGuidelines([created]);
      res.json({ success: true, guideline: created });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async getFacts(req: Request, res: Response): Promise<void> {
    try {
      const data = await FactRepository.getAll();
      res.json({ success: true, facts: data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async addFact(req: Request, res: Response): Promise<void> {
    try {
      const { claimTopic, approvedStatement, sourceCitation, verificationDate } = req.body;
      const created = await FactRepository.create({
        orgId: 'org_inkloom_01',
        claimTopic,
        approvedStatement,
        sourceCitation,
        verificationDate: verificationDate || new Date().toISOString().split('T')[0],
        isActive: true
      });
      await FactIndexer.indexFacts([created]);
      res.json({ success: true, fact: created });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async getTerminology(req: Request, res: Response): Promise<void> {
    try {
      const data = await TerminologyRepository.getAll();
      res.json({ success: true, terminology: data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async addTerminology(req: Request, res: Response): Promise<void> {
    try {
      const { termPattern, preferredTerm, ruleType, explanation } = req.body;
      const created = await TerminologyRepository.create({
        orgId: 'org_inkloom_01',
        termPattern,
        preferredTerm,
        ruleType: ruleType || 'banned',
        explanation: explanation || 'Brand lexicon compliance rule.'
      });
      res.json({ success: true, rule: created });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async getBrandKit(req: Request, res: Response): Promise<void> {
    try {
      const kit = Array.from(inMemoryDb.brandKits.values())[0];
      res.json({ success: true, brandKit: kit });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}
