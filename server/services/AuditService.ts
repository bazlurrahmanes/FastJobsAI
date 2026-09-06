import { AuditLogEntry } from '../types';
import { initDatabase } from '../db';

export class AuditService {
  public static log(entry: {
    userId?: string;
    user_id?: string;
    action: string;
    resourceType?: string;
    resource_type?: string;
    resourceId?: string;
    resource_id?: string;
    oldValue?: any;
    old_value?: any;
    newValue?: any;
    new_value?: any;
    requestId?: string;
    request_id?: string;
    ip?: string;
  }): AuditLogEntry {
    const db = initDatabase();
    const id = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: AuditLogEntry = {
      id,
      userId: entry.userId || entry.user_id || 'system',
      action: entry.action,
      resourceType: entry.resourceType || entry.resource_type || 'generic',
      resourceId: entry.resourceId || entry.resource_id || '',
      oldValue: entry.oldValue !== undefined ? entry.oldValue : entry.old_value,
      newValue: entry.newValue !== undefined ? entry.newValue : entry.new_value,
      timestamp: now,
      requestId: entry.requestId || entry.request_id || 'req_internal',
      ip: entry.ip || '127.0.0.1'
    };

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_value, new_value, timestamp, request_id, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.userId,
      record.action,
      record.resourceType,
      record.resourceId,
      record.oldValue !== undefined ? JSON.stringify(record.oldValue) : null,
      record.newValue !== undefined ? JSON.stringify(record.newValue) : null,
      record.timestamp,
      record.requestId || 'req_internal',
      record.ip || '127.0.0.1'
    );

    return record;
  }

  public static getLogs(filter?: {
    resourceType?: string;
    resource_type?: string;
    resourceId?: string;
    resource_id?: string;
    action?: string;
    limit?: number;
  }): AuditLogEntry[] {
    const db = initDatabase();
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    const resType = filter?.resourceType || filter?.resource_type;
    const resId = filter?.resourceId || filter?.resource_id;

    if (resType) {
      sql += ' AND resource_type = ?';
      params.push(resType);
    }
    if (resId) {
      sql += ' AND resource_id = ?';
      params.push(resId);
    }
    if (filter?.action) {
      sql += ' AND action = ?';
      params.push(filter.action);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(filter?.limit || 200);

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      oldValue: r.old_value ? JSON.parse(r.old_value) : undefined,
      newValue: r.new_value ? JSON.parse(r.new_value) : undefined,
      timestamp: r.timestamp,
      requestId: r.request_id,
      ip: r.ip
    }));
  }
}
