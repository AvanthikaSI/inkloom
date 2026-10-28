import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export interface PythonWorkerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PythonBridgeService {
  private static getWorkerScript(): string {
    const candidates = [
      path.resolve(process.cwd(), 'services', 'vision-worker', 'worker_cli.py'),
      path.resolve(process.cwd(), '..', '..', 'services', 'vision-worker', 'worker_cli.py'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../services/vision-worker/worker_cli.py'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../services/vision-worker/worker_cli.py')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return candidates[0];
  }

  /**
   * Invokes Python document parser for PDF, DOCX, TXT.
   */
  public static async parseDocument(filePath: string): Promise<PythonWorkerResponse> {
    return this.execute(['--action', 'parse_doc', '--file', filePath]);
  }

  /**
   * Invokes Python image worker for Pillow palette extraction and WCAG contrast check.
   */
  public static async auditImage(filePath: string, brandColors?: string[]): Promise<PythonWorkerResponse> {
    const args = ['--action', 'full_image_audit', '--file', filePath];
    if (brandColors && brandColors.length > 0) {
      args.push('--brand_colors', brandColors.join(','));
    }
    return this.execute(args);
  }

  /**
   * Checks contrast ratio between two hex colors.
   */
  public static async checkContrast(fg: string, bg: string): Promise<PythonWorkerResponse> {
    return this.execute(['--action', 'check_contrast', '--fg', fg, '--bg', bg]);
  }

  private static execute(args: string[]): Promise<PythonWorkerResponse> {
    return new Promise((resolve) => {
      const script = this.getWorkerScript();
      const pyProcess = spawn('python', [script, ...args]);
      let stdout = '';
      let stderr = '';

      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          return resolve({
            success: false,
            error: stderr || `Python worker exited with code ${code}`
          });
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (e) {
          resolve({
            success: false,
            error: `Failed to parse Python worker JSON: ${stdout}`
          });
        }
      });
    });
  }
}
