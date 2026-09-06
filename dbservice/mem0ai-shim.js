'use strict';

/**
 * mem0ai v1.0.39 compatibility shim — with real SQLite-backed memory.
 *
 * dbservice/index.js was written for an older mem0ai API that exposed
 * Memory, EmbedderFactory, and LLMFactory from 'mem0ai/oss'.
 * v1.0.39 removed those exports. This shim provides working stubs backed
 * by the local knowledgeStore (SQLite) so that basic store/search/getAll
 * operations actually persist data.
 *
 * Limitations:
 *  - No vector search (BM25-only via knowledgeStore)
 *  - No LLM-based summarisation (BridgeLLM is not wired up)
 *  - update/delete are best-effort
 */

const path = require('path');
const knowledgeStore = require('./lib/knowledgeStore');

// ─── EmbedderFactory ───────────────────────────────────────

class EmbedderFactoryShim {
    constructor() { this._custom = null; }
    set custom(v) { this._custom = v; }
    create(provider, config) {
        if (provider === 'custom') return this._custom || null;
        throw new Error('[mem0ai-shim] EmbedderFactory.create: unsupported provider=' + provider);
    }
}

// ─── LLMFactory ────────────────────────────────────────────

class LLMFactoryShim {
    constructor() { this._custom = null; }
    set custom(v) { this._custom = v; }
    create(provider, config) {
        if (provider === 'custom') return this._custom || null;
        throw new Error('[mem0ai-shim] LLMFactory.create: unsupported provider=' + provider);
    }
}

// ─── Memory (SQLite-backed) ────────────────────────────────

class MemoryShim {
    constructor(config) {
        this._config = config;
        this._table = (config && config.vectorStore && config.vectorStore.config && config.vectorStore.config.collectionName)
            || 'toolbox-memories';
    }

    /**
     * Store a memory entry.
     * Supports two call signatures:
     *   add(text_string, { userId, metadata })   — old mem0 style
     *   add({ messages, userId, metadata })       — new style
     */
    async add(textOrOpts, opts) {
        const ts = Date.now();
        const ns = (opts && opts.userId) || 'default';
        const meta = (opts && opts.metadata) || {};

        let texts = [];
        if (typeof textOrOpts === 'string') {
            texts = [textOrOpts];
        } else if (Array.isArray(textOrOpts)) {
            texts = textOrOpts.map(m => (typeof m === 'string' ? m : m.content || JSON.stringify(m)));
        } else if (textOrOpts && typeof textOrOpts === 'object') {
            const msgs = textOrOpts.messages || [textOrOpts];
            texts = Array.isArray(msgs) ? msgs.map(m => (typeof m === 'string' ? m : m.content || JSON.stringify(m))) : [String(msgs)];
        }

        for (const text of texts) {
            await knowledgeStore.upsert({
                refId: `mem_${ts}_${Math.random().toString(36).slice(2, 8)}`,
                type: 'knowledge',
                subType: meta.role || 'user',
                content: text,
                summary: text.slice(0, 100),
                scope: ns,
                metadata: meta,
                tags: ['memory', 'mem0ai-shim'],
                writeClass: 'explicit',
                source: 'user_explicit',
            });
        }

        return { success: true, count: texts.length };
    }

    /**
     * Search memories by text (BM25).
     * Supports two call signatures for compatibility:
     *   search(query_string, { userId, limit })  — old mem0 style
     *   search({ query, userId, limit })          — new style
     */
    async search(queryOrOpts, opts) {
        let query, userId, limit;
        if (typeof queryOrOpts === 'string') {
            query = queryOrOpts;
            userId = opts && opts.userId;
            limit = (opts && opts.limit) || 10;
        } else {
            query = queryOrOpts && queryOrOpts.query;
            userId = queryOrOpts && queryOrOpts.userId;
            limit = (queryOrOpts && queryOrOpts.limit) || 10;
        }
        if (!query) return [];
        const ns = userId || 'default';
        // knowledgeStore.search(query, types, limit, scope)
        const results = await knowledgeStore.search(query, null, limit, ns);
        return (results || []).map(r => ({
            id: r.refId,
            memory: r.content,
            score: r.score || 0,
            metadata: r.metadata || {},
            created_at: r.created_at || r.updated_at || null,
        }));
    }

    /**
     * Get a single memory by id (key).
     */
    async get({ id } = {}) {
        const row = await knowledgeStore.get(id);
        if (!row) return null;
        return {
            id: row.key,
            memory: row.content,
            metadata: row.metadata || {},
            created_at: row.created_at || null,
        };
    }

    /**
     * List all memories, optionally filtered by userId (namespace).
     */
    async getAll({ userId, limit = 100 } = {}) {
        const ns = userId || undefined;
        // Use findByScope if namespace provided, otherwise query all
        let rows;
        if (ns) {
            rows = await knowledgeStore.findByScope(ns);
        } else {
            // No direct "list all" — use search with empty query as fallback
            rows = [];
        }
        return rows.slice(0, limit).map(r => ({
            id: r.refId,
            memory: r.content,
            metadata: r.metadata || {},
            created_at: r.created_at || r.updated_at || null,
        }));
    }

    /**
     * Update a memory by id.
     */
    async update({ id, data } = {}) {
        const existing = await knowledgeStore.findByRef(id);
        if (!existing) return { success: false, error: 'not found' };
        await knowledgeStore.upsert({
            ...existing,
            content: data || existing.content,
            metadata: { ...existing.metadata, updated: true },
        });
        return { success: true };
    }

    /**
     * Delete a memory by id.
     */
    async delete({ id } = {}) {
        await knowledgeStore.hardRemove(id);
        return { success: true };
    }

    /**
     * Delete all memories, optionally filtered by userId (namespace/scope).
     */
    async deleteAll({ userId } = {}) {
        if (userId) {
            await knowledgeStore.removeByType(null, userId);
        }
        return { success: true };
    }

    /**
     * Return conversation history (recent entries from namespace).
     */
    async history({ userId, limit = 20 } = {}) {
        const ns = userId || 'default';
        const rows = await knowledgeStore.findByScope(ns);
        return rows.slice(0, limit).map(r => ({
            id: r.refId,
            content: r.content,
            role: r.subType || 'user',
            created_at: r.created_at || r.updated_at || null,
        }));
    }
}

// ─── Exports ───────────────────────────────────────────────

module.exports = {
    Memory: MemoryShim,
    EmbedderFactory: new EmbedderFactoryShim(),
    LLMFactory: new LLMFactoryShim(),
};
