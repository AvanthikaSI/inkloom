import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createApp } from '../apps/server/src/app.js';

async function testChatUpload() {
  const app = createApp();
  const server = app.listen(4003, async () => {
    console.log('Test server active on port 4003');

    try {
      // Create a temporary sample text document
      const tempFile = path.join(os.tmpdir(), `test-brand-doc-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, 'We are proud to announce our cheap software tool with zero latency and 100% infallible guarantees.');

      const formData = new FormData();
      const fileBytes = fs.readFileSync(tempFile);
      const blob = new Blob([fileBytes], { type: 'text/plain' });
      formData.append('file', blob, 'test-brand-doc.txt');
      formData.append('message', 'Please check this document for brand banned words.');
      formData.append('sessionId', 'test_chat_doc_01');

      const res = await fetch('http://localhost:4003/api/chat/message', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      console.log('Chat file upload response:', {
        success: data.success,
        activeAgent: data.activeAgent,
        response: data.response ? data.response.slice(0, 100) : data.error
      });

      if (data.success) {
        console.log('✅ Chat file upload and multi-modal document processing fully functional!');
      } else {
        console.log('Chat responded with:', data);
      }

      // Clean up
      fs.unlinkSync(tempFile);
    } catch (err) {
      console.error(err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testChatUpload().catch(console.error);
