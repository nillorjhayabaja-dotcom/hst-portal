import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { GatePassTemplateData, SignatureData } from './templates/gate-pass/helpers/template-data';

export interface RenderedDocument {
  html: string;
  controlNumber: string;
  generatedAt: Date;
}

export class DocumentTemplateService {
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();
  private templatesDir: string;

  constructor(templatesDir: string = '') {
    this.templatesDir = templatesDir || path.join(process.cwd(), 'src/infrastructure/documents/templates');
    this.registerHelpers();
  }

  private registerHelpers() {
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    Handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    Handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    Handlebars.registerHelper('gte', (a: any, b: any) => a >= b);
    Handlebars.registerHelper('and', (...args: any[]) => args.slice(0, -1).every(Boolean));
    Handlebars.registerHelper('or', (...args: any[]) => args.slice(0, -1).some(Boolean));
    Handlebars.registerHelper('not', (a: any) => !a);
    Handlebars.registerHelper('ifCond', (v1: any, v2: any, options: any) => {
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('toLowerCase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
    Handlebars.registerHelper('signatureByRole', (signatures: SignatureData[], role: string) => {
      if (!signatures || !Array.isArray(signatures)) return null;
      const found = signatures.find(s => s.role === role);
      return found || null;
    });
    Handlebars.registerHelper('firstSignature', (signatures: SignatureData[]) => {
      if (!signatures || !Array.isArray(signatures) || signatures.length === 0) return null;
      return signatures[0];
    });
  }

  async renderGatePass(data: GatePassTemplateData): Promise<RenderedDocument> {
    const template = await this.loadTemplate('gate-pass/template.html');
    const html = template(data);
    
    return {
      html,
      controlNumber: data.controlNumber,
      generatedAt: new Date(),
    };
  }

  private async loadTemplate(templatePath: string): Promise<Handlebars.TemplateDelegate> {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const fullPath = path.join(this.templatesDir, templatePath);
    const templateContent = await fs.readFile(fullPath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    this.templateCache.set(templatePath, template);
    
    return template;
  }

  async renderPartial(partialName: string, data: any): Promise<string> {
    const partialPath = path.join(this.templatesDir, 'partials', `${partialName}.html`);
    const partialContent = await fs.readFile(partialPath, 'utf-8');
    const template = Handlebars.compile(partialContent);
    return template(data);
  }

  clearCache() {
    this.templateCache.clear();
  }
}