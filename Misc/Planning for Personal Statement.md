Section 1
why do you want to study this course or subject?
Talk about my passion for everything software and my interest in its higher level applications 
Introduce Arch Linux for the first time (Bring in Bios, Boot Manager and Disk Partition management)
Talk about about my coding skill and how i am able to decompose problems 


Section 2
How have your qualifications and studies helped you to prepare for this course or subject?
Talk about logical thinking gained from computer sci via all the coding experience which i would be able to apply to the Uni courses as well

Talk about motivation and revision habits gained from everything.

Since all of my a-levels are all non-care based subjects (Maths, F Maths, Business and Computer Sci) should target a piece of research that fits into the course i am applying to 

so far i think i can do either Operating systems / Linux or AI and its history / how it works 
but i would most likely just do operating systems 



If I am going to talk about AI i can talk about my locally  run AI (qwen3:4b-instruct) on my Arch Linux Laptop using Ollama 


Section 3
What else have you done to prepare outside of education,  and why are these are experiences useful?

Talk about the game I am making  - talk about adaptability, neuroplasticity and the ability  to learn quickly as i have had to teach myself most if not all of the workflows/disciples of Roblox game development 

Talk about Arch Linux (Again!) - this time talk about my experience while I was dual booting with windows  and then fully moving to Linux

I can also bring in the problem i had with my Intel Drivers and how they affected my transition and how i showed resilience by pushing through (I could also mention how i fixed it via a GRUB command line)

Also i could mention  as a funny joke the time I nuked my hard drive by accident by clicking on the wrong partition  - its possible to also mention why i moved to Linux in the first place but that might not be needed tho :P 

Also about my preferred language with is Lua/Luau but i am always willing ad able learn new ones and intend to learn other langues such as java, PHP, C ++

Also talk about that time i was experimenting with  V2ray, Azure, Shadow-socks and VLESS  + Reality  - for context  i remembered that schools had a method of blocking VPNs so i got curious and how it actually worked. I did actually get the bypass to work (Just the clarify i was only targeting getting Whatsapp.com to load since i didn't have my phone at the time). I learned quite a bit about Microsoft's Azure Architecture , Improved my existing Linux knowledge by introducing ssh  and stumbled upon Deep-Packet inspection which was really interesting.


^---- for the above i have asked Ms Y (Our head of sixth form) if its alright to add this and she said it was alright and that i should. 

This actually has caused me to become really interested in cyber-security and  obfuscation


avoid using 
"From a young age"
"I am passionate about" -- Just reword this and actually prove how i shown this
Quotes from other people
Useless rhetorical questions 
bad spelling and punctuation -- this should be obvious but just in case  
Lies
repetition, quotes  and waffle 


get straight into the content
Depth is often better than breadth, dont mention everything
Discuss don't just list (Evidence is needed!)
Keep it personal, its about you.


try to understand the jargon

think about university experience  that i might want to visit 






## The Actual Write up


---

## Q1 - Why do you want to study this course or subject?

Every abstraction in software is hiding a decision, and what draws me to computer science is wanting to see underneath it: how a language compiles to instructions, how a scheduler decides what runs next, how an operating system arbitrates hardware that doesn't know it's sharing a machine.

Installing Arch Linux turned that curiosity into something practical. Rather than relying entirely on automated configuration, I learned how the system booted in UEFI mode, configured GRUB, and partitioned my own drive for the operating system, boot files and swap. Having to make those decisions myself changed "operating system" from an abstract term into a collection of mechanisms I could investigate and reason about.

The same instinct runs through how I code. I don't approach a large feature directly — I decompose it into smaller, testable pieces, solve each, then reassemble them. That habit of taking systems apart to understand them is why I want to keep studying this subject at degree level, not stop at what I've taught myself.

---

## Q2 - How have your qualifications and studies helped you prepare?


Studying Computer Science alongside Maths and Further Maths has built one specific habit: "practice until all you can think about is maths business and computer science". This was tried and true method as I normally already understood the topics in class however due a lack of practice i often found my self making to most stupid mistakes

None of my four A-levels — Maths, Further Maths, Business and Computer Science — pointed me toward an obvious research topic for university, so I chose one deliberately: operating systems. I've read into process scheduling, virtual memory and filesystem design, and tested it on my own machine rather than take it on faith — watching how Arch schedules competing processes, or behaves when memory runs short.

I've paired this with hands-on AI work: running Qwen3:4B-Instruct locally through Ollama on the same laptop, which meant grappling with quantisation and the real hardware cost of inference rather than treating a model as a black box behind an API. Between the two, operating systems is where I want to specialise — it's the area where my own experimentation and the theory keep confirming each other.

---

## Q3 - What else have you done to prepare outside of education, and why is it useful?

For the past year and a bit, I've been building an action RPG that I'm developing solo in Roblox/Luau as my A-level Computing NEA. With no team to hand work to, I've taught myself most of what the project needs as it comes up — combat systems, UI, animation — often switching between them within the same week. That's forced adaptability: rebuilding my mental model for an unfamiliar discipline quickly, with no course or teacher to fall back on.

Linux gave me a second version of the same lesson, with more failure in it. I dual-booted Windows and Arch before trusting the system enough to move over completely, and partway through hit an Intel graphics driver conflict that broke my display on boot. I traced it to a kernel/firmware/hardware compatibility problem and fixed it with a kernel parameter passed through GRUB*, rather than reinstalling from scratch (which probably wont have worked). (I've also once wiped my Windows Partition during my first attempt of using  Dual Booting) Luau and C# are still the languages I know best, but I'm going to start working through Java, PHP and C++ next, aiming for fluency in an actual tech stack not just Roblox Games.

Also when I was in  year 12 , my school blocked VPN traffic from easily avaible sources such as Proton VPN and I didn't have my phone and  I needed to get WhatsApp working  so i went down a rabbit hole that took me through Shadowsocks and V2Ray to disguise the traffic, then VLESS with Reality to mimic a legitimate site's TLS handshake instead of hiding turns out the firewall wasn't blocking known vpn addresses but actually using Deep Packet Inspection. I ran it on an  Ubuntu Azure VM, learning Azure's networking and firewall rules to expose the service safely, and administered it over SSH. It worked, for WhatsApp, nothing more (as anything else would obviously be stepping a line) but it's what actually pulled me toward cybersecurity and obfuscation.

*- If you are interested it was actually a combination of mutiple parrams which was - "ibt=off intel_idle.max_cstate=1 acpi_osi=Linux acpi_enforce_resources=lax pcie_aspm=force acpi_mask_gpe=0x15 nvidia-drm.modeset=1 pcie_port_pm=off"

but the ones that actually fixed it was ibt=off and intel_idle.max_cstate=1 - the rest are just to make sure Linux has proper access to my GPU for my refresh rate
