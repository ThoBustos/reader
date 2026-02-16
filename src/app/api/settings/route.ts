import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store/settings";

export async function GET() {
  try {
    const settings = getSettings();
    // Don't expose API keys to client
    return NextResponse.json({
      ...settings,
      geminiApiKey: settings.geminiApiKey ? "***" : "",
      claudeApiKey: settings.claudeApiKey ? "***" : "",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = saveSettings(body);
    return NextResponse.json({
      ...updated,
      geminiApiKey: updated.geminiApiKey ? "***" : "",
      claudeApiKey: updated.claudeApiKey ? "***" : "",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
