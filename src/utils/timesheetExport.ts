import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { TimeLog } from '../types';
import { entryTypeLabel, formatTimeRange } from './timesheetUtils';
import { formatReportHours, logDisplayHours } from './timesheetReportUtils';

export interface TimesheetExportMeta {
  periodLabel: string;
  userLabel: string;
  projectLabel: string;
  totalHours: number;
  entryCount: number;
  contributorCount: number;
  projectCount: number;
}

export interface TimesheetExportOptions {
  logs: TimeLog[];
  meta: TimesheetExportMeta;
  hoursByUser?: { label: string; totalHours: number }[];
  hoursByProject?: { label: string; totalHours: number }[];
  filenameBase: string;
}

interface ExportRow {
  date: string;
  user: string;
  project: string;
  workItem: string;
  task: string;
  type: string;
  time: string;
  duration: string;
  hours: number;
  notes: string;
}

function buildExportRows(logs: TimeLog[]): ExportRow[] {
  return [...logs]
    .sort((a, b) => b.logDate.localeCompare(a.logDate) || a.userName.localeCompare(b.userName))
    .map((log) => ({
      date: log.logDate.slice(0, 10),
      user: log.userName,
      project: log.projectName || '—',
      workItem: `${log.workItemNumber}${log.workItemTitle ? ` — ${log.workItemTitle}` : ''}`,
      task: log.taskTitle,
      type: entryTypeLabel(log.entryType),
      time: formatTimeRange(log),
      duration: formatReportHours(logDisplayHours(log)),
      hours: logDisplayHours(log),
      notes: log.description || '—',
    }));
}

function tableHeaders(): string[] {
  return ['Date', 'User', 'Project', 'Work Item', 'Task', 'Type', 'Time', 'Duration', 'Notes'];
}

function tableBody(rows: ExportRow[]): string[][] {
  return rows.map((row) => [
    row.date,
    row.user,
    row.project,
    row.workItem,
    row.task,
    row.type,
    row.time,
    row.duration,
    row.notes,
  ]);
}

export function exportTimesheetPdf({
  logs,
  meta,
  hoursByUser = [],
  hoursByProject = [],
  filenameBase,
}: TimesheetExportOptions) {
  const rows = buildExportRows(logs);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const generatedAt = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.setTextColor(208, 2, 27);
  doc.text('StratoFlow Timesheet Report', 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Period: ${meta.periodLabel}`, 14, 24);
  doc.text(`User: ${meta.userLabel}`, 14, 29);
  doc.text(`Project: ${meta.projectLabel}`, 14, 34);
  doc.text(`Generated: ${generatedAt}`, 14, 39);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Total: ${formatReportHours(meta.totalHours)}  |  Entries: ${meta.entryCount}  |  Contributors: ${meta.contributorCount}  |  Projects: ${meta.projectCount}`,
    14,
    46,
  );

  let nextY = 54;

  if (hoursByUser.length > 0) {
    autoTable(doc, {
      startY: nextY,
      head: [['Hours by user', 'Hours']],
      body: hoursByUser.map((item) => [item.label, `${item.totalHours.toFixed(1)}h`]),
      theme: 'grid',
      headStyles: { fillColor: [208, 2, 27] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  if (hoursByProject.length > 0) {
    autoTable(doc, {
      startY: nextY,
      head: [['Hours by project', 'Hours']],
      body: hoursByProject.map((item) => [item.label, `${item.totalHours.toFixed(1)}h`]),
      theme: 'grid',
      headStyles: { fillColor: [208, 2, 27] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  autoTable(doc, {
    startY: nextY,
    head: [tableHeaders()],
    body: tableBody(rows),
    theme: 'striped',
    headStyles: { fillColor: [208, 2, 27], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 24 },
      2: { cellWidth: 28 },
      3: { cellWidth: 38 },
      4: { cellWidth: 32 },
      5: { cellWidth: 16 },
      6: { cellWidth: 24 },
      7: { cellWidth: 16 },
      8: { cellWidth: 42 },
    },
  });

  doc.save(`${filenameBase}.pdf`);
}

export function exportTimesheetExcel({
  logs,
  meta,
  hoursByUser = [],
  hoursByProject = [],
  filenameBase,
}: TimesheetExportOptions) {
  const rows = buildExportRows(logs);
  const workbook = XLSX.utils.book_new();
  const generatedAt = new Date().toLocaleString();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['StratoFlow Timesheet Report'],
    [],
    ['Period', meta.periodLabel],
    ['User filter', meta.userLabel],
    ['Project filter', meta.projectLabel],
    ['Generated', generatedAt],
    [],
    ['Total hours', meta.totalHours],
    ['Time entries', meta.entryCount],
    ['Contributors', meta.contributorCount],
    ['Projects', meta.projectCount],
    [],
    ['Hours by user'],
    ['User', 'Hours'],
    ...hoursByUser.map((item) => [item.label, Number(item.totalHours.toFixed(2))]),
    [],
    ['Hours by project'],
    ['Project', 'Hours'],
    ...hoursByProject.map((item) => [item.label, Number(item.totalHours.toFixed(2))]),
  ]);
  summarySheet['!cols'] = [{ wch: 22 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const entriesSheet = XLSX.utils.aoa_to_sheet([
    tableHeaders(),
    ...tableBody(rows),
  ]);
  entriesSheet['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 34 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Time Entries');

  XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
}
