import { describe, it, expect, beforeEach } from 'vitest';
import { MerkleTree } from '@/lib/sync/merkle-tree-sync';

describe('MerkleTree', () => {
  let tree: MerkleTree;

  beforeEach(() => {
    tree = new MerkleTree();
  });

  describe('Tree Construction', () => {
    it('should build tree from file hashes', () => {
      const files = [
        { path: 'src/app.ts', hash: 'abc123' },
        { path: 'src/utils.ts', hash: 'def456' },
        { path: 'src/types.ts', hash: 'ghi789' },
      ];

      tree.build(files);

      expect(tree.root).toBeDefined();
      expect(tree.root.hash).toHaveLength(64); // SHA-256
      expect(tree.leaves).toHaveLength(3);
    });

    it('should handle empty file list', () => {
      tree.build([]);
      expect(tree.root).toBeNull();
      expect(tree.leaves).toHaveLength(0);
    });

    it('should handle single file', () => {
      tree.build([{ path: 'index.ts', hash: 'xyz' }]);
      expect(tree.root.hash).toBe('xyz'); // Root is the leaf
    });
  });

  describe('Diff Detection', () => {
    it('should detect added files', () => {
      const oldTree = new MerkleTree();
      oldTree.build([
        { path: 'src/app.ts', hash: 'abc' },
      ]);

      const newTree = new MerkleTree();
      newTree.build([
        { path: 'src/app.ts', hash: 'abc' },
        { path: 'src/new.ts', hash: 'xyz' }, // Added
      ]);

      const diff = oldTree.diff(newTree);
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].path).toBe('src/new.ts');
    });

    it('should detect modified files', () => {
      const oldTree = new MerkleTree();
      oldTree.build([
        { path: 'src/app.ts', hash: 'abc' },
      ]);

      const newTree = new MerkleTree();
      newTree.build([
        { path: 'src/app.ts', hash: 'xyz' }, // Modified
      ]);

      const diff = oldTree.diff(newTree);
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].path).toBe('src/app.ts');
      expect(diff.modified[0].oldHash).toBe('abc');
      expect(diff.modified[0].newHash).toBe('xyz');
    });

    it('should detect deleted files', () => {
      const oldTree = new MerkleTree();
      oldTree.build([
        { path: 'src/app.ts', hash: 'abc' },
        { path: 'src/old.ts', hash: 'xyz' },
      ]);

      const newTree = new MerkleTree();
      newTree.build([
        { path: 'src/app.ts', hash: 'abc' },
      ]);

      const diff = oldTree.diff(newTree);
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0].path).toBe('src/old.ts');
    });

    it('should detect no changes when trees are identical', () => {
      const tree1 = new MerkleTree();
      const tree2 = new MerkleTree();
      const files = [
        { path: 'src/app.ts', hash: 'abc' },
        { path: 'src/utils.ts', hash: 'def' },
      ];

      tree1.build(files);
      tree2.build(files);

      const diff = tree1.diff(tree2);
      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.deleted).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(2);
    });
  });

  describe('Proof Generation', () => {
    it('should generate merkle proof for file', () => {
      const files = [
        { path: 'a.ts', hash: 'a1' },
        { path: 'b.ts', hash: 'b1' },
        { path: 'c.ts', hash: 'c1' },
        { path: 'd.ts', hash: 'd1' },
      ];

      tree.build(files);
      const proof = tree.generateProof('b.ts');

      expect(proof).toBeDefined();
      expect(proof.path).toBe('b.ts');
      expect(proof.siblings).not.toHaveLength(0);
    });

    it('should verify valid proof', () => {
      const files = [
        { path: 'a.ts', hash: 'a1' },
        { path: 'b.ts', hash: 'b1' },
      ];

      tree.build(files);
      const proof = tree.generateProof('a.ts');
      const isValid = tree.verifyProof(proof, tree.root.hash);

      expect(isValid).toBe(true);
    });

    it('should reject invalid proof', () => {
      const files = [{ path: 'a.ts', hash: 'a1' }];
      tree.build(files);

      const fakeProof = {
        path: 'a.ts',
        hash: 'wrong',
        siblings: [],
      };

      const isValid = tree.verifyProof(fakeProof, tree.root.hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle large file sets efficiently', () => {
      const largeFileSet = Array.from({ length: 10000 }, (_, i) => ({
        path: `file-${i}.ts`,
        hash: `hash-${i}`,
      }));

      const start = performance.now();
      tree.build(largeFileSet);
      const buildTime = performance.now() - start;

      expect(buildTime).toBeLessThan(1000); // Should build in < 1s
      expect(tree.leaves).toHaveLength(10000);
    });

    it('should efficiently find differences in large trees', () => {
      const baseFiles = Array.from({ length: 1000 }, (_, i) => ({
        path: `file-${i}.ts`,
        hash: `hash-${i}`,
      }));

      const tree1 = new MerkleTree();
      tree1.build(baseFiles);

      const modifiedFiles = [...baseFiles];
      modifiedFiles[500] = { path: 'file-500.ts', hash: 'modified' };

      const tree2 = new MerkleTree();
      tree2.build(modifiedFiles);

      const start = performance.now();
      const diff = tree1.diff(tree2);
      const diffTime = performance.now() - start;

      expect(diffTime).toBeLessThan(100); // Should diff in < 100ms
      expect(diff.modified).toHaveLength(1);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize tree', () => {
      const files = [
        { path: 'a.ts', hash: 'a1' },
        { path: 'b.ts', hash: 'b1' },
      ];

      tree.build(files);
      const serialized = tree.serialize();
      
      const newTree = new MerkleTree();
      newTree.deserialize(serialized);

      expect(newTree.root.hash).toBe(tree.root.hash);
      expect(newTree.leaves).toHaveLength(tree.leaves.length);
    });
  });
});
