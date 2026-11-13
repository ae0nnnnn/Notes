## Input Manager

```
Game:GetService(UIS) --> UIS
Game:GetService(RS).Events.RemoteEvent --> RemoteEvent
require(Game:GetService(RS).Modules.SomeActionModule) --> Module

//Server actions such as Combat
UIS.OnKeyPress:Connect(function(keycode)
	if keycode == actionKeycode then
		RemoteEvent:FireServer(action)
	end 
)


// Client actions such as movement
UIS.OnKeyPress:Connect(function(keycode)
	if keycode == actionKeycode then
		Module.Start(parrams)
	end 
)

// this Pattern is then reapted for evey action in the game
```




## State Machine 

```
class StateMachine 
	private States 
	private Current 
	private TimeInState 
	private object 
	
	public procedure new (states, Initial, obj)
		if states[Initial] = nil then
			print("Invalid State has been passed as the Initial State- Aborting")
		endif
		States = states
		Current = Initial 
		TimeInState = 0
		Object = obj
		
		Start = states[Initial]
		
		if Start then
			Start.Enter(obj)
		endif 
	endprocedure
	
	public function GetState()
		return Current 
	endfunction 
	
	public procedure TransitonTo(nextState)
		currentDef = States[Current]
		
		if currentDef and currentDef.Exit
			currentDef.Exit(obj)
		endif 	
		
		prev = Current 
		Current = nextState
		TimeInState = 0
		
		print("[StateMachine] " + prev + " -> " + nextState)
		
		local nextDef = States[nextState]
		
		if nextDef = nil then
			print("Invalid State has been passed as the next State - Aborting")
		endif
		
		if nextDef.Enter then
			nextDef.Enter(object)
		end 
		
	endprocedure 
	
	public procedure Update(DeltaT)
		TimeInState = TimeInState + DeltaT
		Def = States[Current]
		
		if Def = nil or Def.Update = nil then 
			print("No Update for State" + Def) 
		endif
		NextState = Def.Update(obj,DeltaT)
		
		if NexState and NextState ~= Current then 
			TransitonTo(nextState)
		endif 
	endprocedure 		
endclass
```





## Helpful Module Snippet 1


```
Module procedure DamageDealer(char,damage)
	hum = char.Humanoid
	if not char or not hum return end  // End the function early if there no player char or humanoid
	if DealDamage(hum,damage) then 
		Ragdoll(char,calcDownTime(char))
		SetAttribute(char, Downed, True)
		delay(calcDownTime(char)
		SetAttribute(char, Downed, False)
	end
endprocedure
```


```
// ChangeWeapon Procedure
Module procedure changeWeapon(plr,char,torso)
	if not char or not plr or not torso then return end
	ResetCombatCharAttributes(char)
	
	currentWeapon = char:GetAttribute("CurrentWeapon")
	WeaponModel = CreateWeaponModel(currentWeapon)
	
	WeldWeaponToChar(WeaponModel,plr,torso)
	
	Module.CheckAttr(char)
	
	AnimKiller(char,plr)
	
	EquipDebounce[plr] = false
	
endprocedure

```



```
// Foward Checker function

Module function CheckFront(char,enemyChar)
	if not char or not enemyChar return nil end
	if char:IsFacing(EnemyChar) then 
		return true 
	else 
		return false
	end
endfunction
```



```
// Backwards Checker function

Module function CheckBehindchar,enemyChar)
	if not char or not enemyChar return nil end
	if not char:IsFacing(EnemyChar) then 
		return true 
	else 
		return false
	end
endfunction
```


```
// Reset Mobility Procedure

Module procedure ResetMobility(char)
	hum = char.Humanoid
	if not char or not hum then return end 
	SpeedModule = Game:GetService(RS):Require(SpeedModule)
	SprintFlag = char:GetAttribute("Sprinting")
	
	hum.WalkSpeed  = SpeedModule.MovmentSpeed(SprintFlag) 
	hum.JumpHeight = SpeedModule.JumpSpeed()
endprocedure

```


## Blocking Module

```
module function HyprParryLanded(char,echar,npc)
	if char or not eChar then return end 
	
	EHRP, HRP = GetHummanoidRootParts(Echar, char)
	
	if not EHRP or not HRP then return end
	
	local ECurrentWeapon = echar:GetAttribute("CurrentWeapon)
	SuccessfulHypr[identifer] = true 
	
	ClearParryState(eChar)
	
	FireVFX_Event("CombatEffects","HyprParry", char, eChar)
	
	Tag = newInstance("ObjectValue")
	Tag. Name = Target
	Tage. Value = char
	
	TurnOffAutoRotate(Echar.Humanoid, char.Humanoid)
	AnchorParts(HRP,EHRP)
	
	SetAttributes("Stunned", "Iframes",true, char,eChar)
	
	PlayRecoverAnim(Echar)
	PlayStaggerAnim(char)
endfunction
```



```
module function ParryLanded(char, eChar, hitpos, npc)
	identifer = GetPlrFromChar(eChar) or npc
	result  = "HitLanded"
	SucessfulParry[identifer] = true 
	if identifer then
		Combat_Data.APFrames[identifer] = tick() + AP_WINDOW
	end
	
	if ParryAnims[identifier] then
		ParryAnims[identifier]:Stop()
	end 
	
	ClearParryState(eChar,npc)
	
	RefundPosture(Echar)
	PunsishPosture(Char)
	CombatTagService.Tag(eChar,char)
	
	FireVFX_Event("CombatEffects","Parry", hitpos, 3)
	
	if not SkillINfo[GetCharIntent(Char)].ParryInterupt then
		AnimKiller(char.Humanoid)
		PlayGotParriedAnim(char)
	end 
	
	PlayParryLandedAnim(Echar)
	
	
	
	Result = "Parried"
	Return Result
endfunction
```


```
module function
```







