package com.homeboxapp.e2e;

import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import java.io.File;
import java.io.FileOutputStream;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.ArrayList;
import java.util.List;

/** Runs on a dedicated emulator against the loopback Homebox fixture. */
public class NativeFlow extends Instrumentation {
  private UiAutomation ui;
  private boolean reload;
  @Override public void onCreate(Bundle args) { super.onCreate(args); reload="true".equals(args.getString("reload")); start(); }
  @Override public void onStart() {
    Bundle result = new Bundle();
    try {
      ui = getUiAutomation();
      AccessibilityServiceInfo info=ui.getServiceInfo();
      info.flags |= AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
      ui.setServiceInfo(info);
      Intent launch = getTargetContext().getPackageManager().getLaunchIntentForPackage("com.homeboxapp");
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
      getTargetContext().startActivity(launch);
      pause(1800);
      if(reload) {
        click("Items",true,false);
        click("E2E Camera edited",false,false);
        find("Photos",false,true,false);
        click("Open photo 1",false,true);
        click("Zoom in",true,false);
        pause(1200);
        assertPhotoVisible();
        click("Close gallery",true,false);
        capture();
        result.putString("result","PASS: reload");finish(0,result);return;
      }
      click("Settings", true, false);
      click("Server Configuration", false, true);
      fill("Server Name", "E2E fixture");
      fill("Host", "http://127.0.0.1:18080");
      fill("Username", "test");
      fill("Password", "test-password");
      click("Save Server", true, true);
      click("OK", true, false);
      ui.performGlobalAction(1); // back to Settings
      pause(600);
      click("Home",true,false);
      click("Add item", true, false);
      fill("Item name", "E2E Camera");
      click("Choose location",true,true);
      click("Search locations",true,true);
      pause(1000);
      fill("Search locations","E2E");
      assertLocationResultsVisible();
      captureNamed("quick-entry-keyboard.png");
      click("E2E Garage",true,true);
      click("Library", true, true);
      pause(800);
      click("Photo taken", false, false);
      click("Done", true, false);
      pause(800);
      click("Save & next", true, true);
      pause(1500);
      // Quick entry is the default; success may use inline feedback.
      dismissOptionalOk();
      click("Cancel",true,false);
      click("Items", true, false);
      click("Display",true,false);
      click("Grid",true,false);
      click("Close",true,false);
      click("Display",true,false);
      click("List",true,false);
      click("Close",true,false);
      click("Filters",true,false);
      click("uninsured",true,true);
      click("Apply filters",true,true);
      click("Remove filter: uninsured",true,false);
      click("Saved",true,false);
      click("Missing photos",true,true);
      click("Remove filter: Missing photos",true,false);
      click("E2E Camera", false, false);
      click("Edit", true, true);
      fill("Item name", "E2E Camera edited");
      click("Save Changes", true, true);
      dismissOptionalOk();
      click("Items", true, false);
      find("E2E Camera edited", false, false, false);
      click("E2E Camera edited",true,false);
      click("Item actions",true,true);
      click("Duplicate item",true,false);
      find("E2E Camera edited (copy)",true,false,true);
      click("Cancel",true,false);
      result.putString("result", "PASS: login/create/photo/edit");
      finish(0, result);
    } catch (Throwable error) {
      try {captureNamed("native-failure.png");}catch(Exception ignored){}
      result.putString("result", "FAIL: " + error + "\n" + dump());
      finish(1, result);
    }
  }
  private void pause(long ms) { SystemClock.sleep(ms); }
  private List<AccessibilityNodeInfo> nodes() {
    List<AccessibilityNodeInfo> list = new ArrayList<>();
    collect(ui.getRootInActiveWindow(), list);
    return list;
  }
  private void collect(AccessibilityNodeInfo n, List<AccessibilityNodeInfo> list) {
    if (n == null) return;
    list.add(n);
    for (int i=0;i<n.getChildCount();i++) collect(n.getChild(i), list);
  }
  private boolean matches(CharSequence text,String label,boolean exact) {
    return text != null && (exact ? text.toString().equalsIgnoreCase(label) : text.toString().toLowerCase().contains(label.toLowerCase()));
  }
  private AccessibilityNodeInfo find(String label, boolean exact, boolean scroll, boolean input) {
    for (int attempt=0;attempt<24;attempt++) {
      List<AccessibilityNodeInfo> available=nodes();
      for(int pass=0;pass<2;pass++) for (AccessibilityNodeInfo n:available) {
        CharSequence value=pass==0 ? n.getContentDescription() : n.getText();
        if (n.isVisibleToUser() && (!input || n.isEditable()) && matches(value,label,exact)) return n;
      }
      if (scroll) {
        for (AccessibilityNodeInfo n:nodes()) if (n.isScrollable() && n.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) break;
      }
      pause(250);
    }
    throw new AssertionError("Missing " + label);
  }
  private void click(String label, boolean exact, boolean scroll) {
    AccessibilityNodeInfo node = find(label,exact,scroll,false);
    while(node != null && !node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) node=node.getParent();
    if(node == null) throw new AssertionError("Cannot click " + label);
    pause(500);
  }
  private void fill(String label,String value) {
    AccessibilityNodeInfo node=find(label,false,true,true);
    Bundle args=new Bundle();args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,value);
    if(!node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT,args)) throw new AssertionError("Cannot type " + label);
    pause(200);
  }
  private void dismissOptionalOk() {
    pause(700);
    for(AccessibilityNodeInfo n:nodes()) if(matches(n.getText(),"OK",true)) {n.performAction(AccessibilityNodeInfo.ACTION_CLICK);pause(500);return;}
  }
  private void assertLocationResultsVisible() {
    Rect input=new Rect(), match=new Rect();
    find("Search locations",true,false,true).getBoundsInScreen(input);
    find("E2E Garage",true,false,false).getBoundsInScreen(match);
    int keyboardTop=Integer.MAX_VALUE;
    for(AccessibilityWindowInfo window:ui.getWindows()) if(window.getType()==AccessibilityWindowInfo.TYPE_INPUT_METHOD) {
      Rect bounds=new Rect();window.getBoundsInScreen(bounds);keyboardTop=bounds.top;
    }
    if(keyboardTop==Integer.MAX_VALUE) throw new AssertionError("Location check requires the software keyboard");
    if(input.top<0 || match.top<input.bottom || match.bottom>keyboardTop || !find("E2E Garage",true,false,false).isVisibleToUser()) {
      throw new AssertionError("Location list obscured: input="+input+", match="+match+", keyboardTop="+keyboardTop);
    }
  }
  private void captureNamed(String name) throws Exception {
    Bitmap bitmap=ui.takeScreenshot();
    File directory=getTargetContext().getExternalFilesDir(null);directory.mkdirs();
    try(FileOutputStream output=new FileOutputStream(new File(directory,name))) {bitmap.compress(Bitmap.CompressFormat.PNG,100,output);}
  }
  private void assertPhotoVisible() {
    Bitmap bitmap=ui.takeScreenshot();
    int blue=0;
    for(int y=0;y<bitmap.getHeight();y+=20) for(int x=0;x<bitmap.getWidth();x+=20) {
      int pixel=bitmap.getPixel(x,y);
      int red=(pixel>>16)&255, green=(pixel>>8)&255, b=pixel&255;
      if(red<70 && green>120 && green<200 && b>190) blue++;
    }
    if(blue<15) throw new AssertionError("Uploaded fixture photo did not render in gallery");
  }
  private void capture() throws Exception {
    Bitmap bitmap=ui.takeScreenshot();
    File directory=getTargetContext().getExternalFilesDir(null);
    directory.mkdirs();
    try(FileOutputStream output=new FileOutputStream(new File(directory,"flow-final.png"))) {bitmap.compress(Bitmap.CompressFormat.PNG,100,output);}
  }
  private String dump() {
    StringBuilder result=new StringBuilder();
    for(AccessibilityNodeInfo n:nodes()) if(n.getText()!=null || n.getContentDescription()!=null) {Rect bounds=new Rect();n.getBoundsInScreen(bounds);result.append(n.getText()).append(" | ").append(n.getContentDescription()).append(" ").append(bounds).append(" visible=").append(n.isVisibleToUser()).append(" editable=").append(n.isEditable()).append('\n');}
    return result.toString();
  }
}
