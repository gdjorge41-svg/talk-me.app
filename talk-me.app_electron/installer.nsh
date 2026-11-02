!macro customInstall
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Talk.me" dir=in action=allow program="$INSTDIR\Talk-me.exe" enable=yes'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Talk.me"'
!macroend
