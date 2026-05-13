import { google } from 'googleapis';
import path from 'path';

const KEY_FILE_PATH = path.join(process.cwd(), 'acountGSC', 'gsc-insight-engine-346a9f2b7bd6.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

export async function getGSCClient() {
  let auth;
  
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Autenticação via Variável de Ambiente (Ideal para Vercel)
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES
    });
  } else {
    // Autenticação via Arquivo Físico (Local)
    auth = new google.auth.GoogleAuth({ 
      keyFile: KEY_FILE_PATH, 
      scopes: SCOPES 
    });
  }
  
  return google.searchconsole({ version: 'v1', auth });
}

export async function listSites() {
  const gsc = await getGSCClient();
  const response = await gsc.sites.list();
  return response.data.siteEntry || [];
}

export async function getDetailedInsights(siteUrl: string, daysOrStart: any, possibleEnd?: string) {
  const gsc = await getGSCClient();
  
  let startDate: string;
  let endDate: string;

  if (typeof daysOrStart === 'number') {
    const today = new Date();
    endDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    startDate = new Date(today.getTime() - (daysOrStart + 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  } else {
    startDate = daysOrStart;
    endDate = possibleEnd!;
  }
  
  // Cálculo do período anterior para comparação
  const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
  const prevEndDate = new Date(new Date(startDate).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const prevStartDate = new Date(new Date(startDate).getTime() - duration - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const commonBody = { siteUrl, startDate, endDate };
  const prevBody = { siteUrl, startDate: prevStartDate, endDate: prevEndDate };

  const [currentTotals, prevTotals, keywords, pages, history] = await Promise.all([
    gsc.searchanalytics.query({ siteUrl, requestBody: { ...commonBody } }),
    gsc.searchanalytics.query({ siteUrl, requestBody: prevBody }),
    gsc.searchanalytics.query({ siteUrl, requestBody: { ...commonBody, dimensions: ['query'], rowLimit: 100 } }),
    gsc.searchanalytics.query({ siteUrl, requestBody: { ...commonBody, dimensions: ['page'], rowLimit: 50 } }),
    gsc.searchanalytics.query({ siteUrl, requestBody: { ...commonBody, dimensions: ['date'], rowLimit: 365 } })
  ]);

  return {
    current: currentTotals.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    previous: prevTotals.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    keywords: keywords.data.rows || [],
    pages: pages.data.rows || [],
    history: history.data.rows || [],
    period: { start: startDate, end: endDate }
  };
}

export async function inspectURL(siteUrl: string, inspectionUrl: string) {
  const gsc = await getGSCClient();
  const response = await gsc.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl,
      siteUrl,
    }
  });
  return response.data;
}
