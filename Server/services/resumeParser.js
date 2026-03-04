const fs       = require('fs');
const path     = require('path');
/**
 * Parse a PDF resume from a local disk path and return extracted text.
 * This function lazily requires `pdf-parse` to avoid startup crashes
 * in environments where DOM APIs are not available.
 * @param {string} localPath - Path relative to process.cwd() (e.g. "uploads/resumes/resume_xxx.pdf")
 * @returns {Promise<string>} Extracted plain text, or empty string on failure.
 */
const parseResumeFromPath = async (localPath) => {
  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
  } catch (rqErr) {
    console.warn('[resumeParser] pdf-parse not available or failed to load:', rqErr.message);
    return '';
  }

  try {
    const absolutePath = path.isAbsolute(localPath)
      ? localPath
      : path.join(process.cwd(), localPath);

    const buffer = fs.readFileSync(absolutePath);
    const data   = await pdfParse(buffer);
    return (data.text || '').trim();
  } catch (err) {
    console.error('[resumeParser] Parse error (local path):', err && err.message ? err.message : err);
    return '';
  }
};

/**
 * Parse a PDF resume by downloading it from a public URL.
 * Used as a fallback when the local path is unavailable.
 * @param {string} url - Public URL to the PDF file.
 * @returns {Promise<string>} Extracted plain text, or empty string on failure.
 */
const parseResumeFromUrl = async (url) => {
  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
  } catch (rqErr) {
    console.warn('[resumeParser] pdf-parse not available or failed to load:', rqErr.message);
    return '';
  }

  try {
    const axios    = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer   = Buffer.from(response.data);
    const data     = await pdfParse(buffer);
    return (data.text || '').trim();
  } catch (err) {
    console.error('[resumeParser] Parse error (URL):', err && err.message ? err.message : err);
    return '';
  }
};

module.exports = { parseResumeFromPath, parseResumeFromUrl };
