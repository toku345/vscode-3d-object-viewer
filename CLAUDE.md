# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) へのガイダンスを提供します。

## 開発コマンド

### ビルドとコンパイル
- `npm run compile` - TypeScriptをJavaScriptにコンパイル
- `npm run watch` - 開発中のTypeScriptコンパイルのウォッチモード
- `npm run vscode:prepublish` - パブリッシュ前のコンパイル

### コード品質
- `npm run lint` - srcディレクトリでESLintを実行
- `npm run test` - テストを実行（最初にcompileとlintを実行）

### 拡張機能の実行
- VS CodeでF5キーを押して、拡張機能がロードされた新しいExtension Development Hostウィンドウを起動
- 拡張機能は`out/`ディレクトリにコンパイルされる

## アーキテクチャ概要

このプロジェクトは3DオブジェクトビューアーのVS Code拡張機能です。標準的なVS Code拡張機能アーキテクチャに従っています：

- **エントリポイント**: `src/extension.ts`に`activate()`と`deactivate()`関数を含む
- **コマンド**: Webviewパネルで3Dビューアーを開く`3d-object-viewer-kiro.open3DViewer`コマンドを実装
- **ViewerPanelManager**: 3DビューアーのWebviewパネルの作成とライフサイクルを管理
- **Webviewコンテンツ**: 3DレンダリングのためのThree.js統合を含むHTMLコンテンツを生成
- **TypeScript設定**: Strictモード有効、ES2022にコンパイル、`out/`ディレクトリに出力
- **拡張機能マニフェスト**: `package.json`で拡張機能のメタデータとコマンドのコントリビューションを定義

この拡張機能は、インタラクティブなコントロールを備えた3DオブジェクトをレンダリングするためにThree.jsを使用したWebviewベースの3Dビューアーを提供します。