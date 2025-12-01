import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

// --- Types ---

type Segment = {
  id: string;
  text: string;
  isItalic?: boolean;
};

type PuzzleData = {
  description: string;
  correctSegments: { text: string; isItalic?: boolean }[];
  distractors: { text: string; isItalic?: boolean }[];
  hint: string;
};

type Puzzle = {
  description: string;
  correctSegments: Segment[]; // The correct order
  distractors: Segment[]; // Wrong tiles
  hint: string;
};

type GameState = "MENU" | "LOADING" | "PLAYING" | "SUCCESS" | "FAILURE" | "GAMEOVER" | "ROUND_OVER_LOSS";

// --- Static Database ---

const PUZZLE_DB: PuzzleData[] = [
  {
    description: "Cite the 1966 Supreme Court case Miranda v. Arizona, found in volume 384 of the United States Reports at page 436.",
    correctSegments: [
      { text: "Miranda", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Arizona", isItalic: true },
      { text: "," },
      { text: "384" },
      { text: "U.S." },
      { text: "436" },
      { text: "(1966)" }
    ],
    distractors: [
      { text: "vs." },
      { text: "US" },
      { text: "385" },
      { text: "S. Ct." },
      { text: "Ct." },
      { text: "[1966]" }
    ],
    hint: "The case name is italicized. 'U.S.' always has periods. Volume comes before the reporter."
  },
  {
    description: "Cite the 1954 Supreme Court case Brown v. Board of Education, found in volume 347 of the United States Reports at page 483.",
    correctSegments: [
      { text: "Brown", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Board", isItalic: true },
      { text: "of", isItalic: true },
      { text: "Educ.", isItalic: true },
      { text: "," },
      { text: "347" },
      { text: "U.S." },
      { text: "483" },
      { text: "(1954)" }
    ],
    distractors: [
      { text: "Education" },
      { text: "Bd." },
      { text: "348" },
      { text: "US" },
      { text: "1954" }
    ],
    hint: "Abbreviate 'Education' to 'Educ.' in case names. Don't forget the periods in 'U.S.'."
  },
  {
    description: "Cite the 1803 Supreme Court case Marbury v. Madison, found in volume 5 of the United States Reports at page 137.",
    correctSegments: [
      { text: "Marbury", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Madison", isItalic: true },
      { text: "," },
      { text: "5" },
      { text: "U.S." },
      { text: "137" },
      { text: "(1803)" }
    ],
    distractors: [
      { text: "1 Cranch" },
      { text: "(Cranch)" },
      { text: "vs." },
      { text: "1801" },
      { text: "US" }
    ],
    hint: "While often cited to Cranch, strictly use 'U.S.' if available. Volume number is small (5)."
  },
  {
    description: "Cite the 1963 Supreme Court case Gideon v. Wainwright, found in volume 372 of the United States Reports at page 335.",
    correctSegments: [
      { text: "Gideon", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Wainwright", isItalic: true },
      { text: "," },
      { text: "372" },
      { text: "U.S." },
      { text: "335" },
      { text: "(1963)" }
    ],
    distractors: [
      { text: "373" },
      { text: "USA" },
      { text: "vs" },
      { text: "(1964)" },
      { text: "Wainright" } // misspelled
    ],
    hint: "Check the spelling of Wainwright. Volume is 372."
  },
  {
    description: "Cite the 1945 Supreme Court case International Shoe Co. v. Washington, found in volume 326 of the United States Reports at page 310.",
    correctSegments: [
      { text: "Int'l", isItalic: true },
      { text: "Shoe", isItalic: true },
      { text: "Co.", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Washington", isItalic: true },
      { text: "," },
      { text: "326" },
      { text: "U.S." },
      { text: "310" },
      { text: "(1945)" }
    ],
    distractors: [
      { text: "International" },
      { text: "Company" },
      { text: "Wash." },
      { text: "325" },
      { text: "US" }
    ],
    hint: "Abbreviate 'International' to 'Int'l'. Spell out state names when they are the entire party name."
  },
  {
    description: "Cite the 1938 Supreme Court case Erie Railroad Co. v. Tompkins, found in volume 304 of the United States Reports at page 64.",
    correctSegments: [
      { text: "Erie", isItalic: true },
      { text: "R.R.", isItalic: true },
      { text: "Co.", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Tompkins", isItalic: true },
      { text: "," },
      { text: "304" },
      { text: "U.S." },
      { text: "64" },
      { text: "(1938)" }
    ],
    distractors: [
      { text: "Railroad" },
      { text: "Ry." },
      { text: "RR" },
      { text: "305" },
      { text: "US" }
    ],
    hint: "Abbreviate 'Railroad' to 'R.R.'. 'Co.' is required here."
  },
  {
    description: "Cite the 1928 New York Court of Appeals case Palsgraf v. Long Island Railroad Co., found in volume 248 of the New York Reports at page 339.",
    correctSegments: [
      { text: "Palsgraf", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Long", isItalic: true },
      { text: "Island", isItalic: true },
      { text: "R.R.", isItalic: true },
      { text: "Co.", isItalic: true },
      { text: "," },
      { text: "248" },
      { text: "N.Y." },
      { text: "339" },
      { text: "(1928)" }
    ],
    distractors: [
      { text: "N.Y.S." },
      { text: "NY" },
      { text: "Railroad" },
      { text: "L.I." },
      { text: "(N.Y. 1928)" }
    ],
    hint: "This is a state case. The reporter is 'N.Y.'. Do not include the court abbreviation inside the parenthetical because 'N.Y.' clearly indicates the high court."
  },
  {
    description: "Cite the 1974 Supreme Court case United States v. Nixon, found in volume 418 of the United States Reports at page 683.",
    correctSegments: [
      { text: "United", isItalic: true },
      { text: "States", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Nixon", isItalic: true },
      { text: "," },
      { text: "418" },
      { text: "U.S." },
      { text: "683" },
      { text: "(1974)" }
    ],
    distractors: [
      { text: "U.S." }, // As party name, usually spelled out in main citation if opposed to private party, but for US v Nixon often kept full.
      { text: "US" },
      { text: "419" },
      { text: "President" }
    ],
    hint: "Spell out 'United States' when it is a party name in the case title."
  },
  {
    description: "Cite the 1919 Supreme Court case Schenck v. United States, found in volume 249 of the United States Reports at page 47.",
    correctSegments: [
      { text: "Schenck", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "United", isItalic: true },
      { text: "States", isItalic: true },
      { text: "," },
      { text: "249" },
      { text: "U.S." },
      { text: "47" },
      { text: "(1919)" }
    ],
    distractors: [
      { text: "USA" },
      { text: "248" },
      { text: "US" },
      { text: "(1918)" }
    ],
    hint: "Volume 249. 'United States' is spelled out as a party."
  },
  {
    description: "Cite the 1984 Supreme Court case Chevron U.S.A., Inc. v. Natural Resources Defense Council, Inc., found in volume 467 of the United States Reports at page 837.",
    correctSegments: [
      { text: "Chevron", isItalic: true },
      { text: "U.S.A.", isItalic: true },
      { text: ",", isItalic: true },
      { text: "Inc.", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Nat.", isItalic: true },
      { text: "Res.", isItalic: true },
      { text: "Def.", isItalic: true },
      { text: "Council", isItalic: true },
      { text: ",", isItalic: true },
      { text: "Inc.", isItalic: true },
      { text: "," },
      { text: "467" },
      { text: "U.S." },
      { text: "837" },
      { text: "(1984)" }
    ],
    distractors: [
      { text: "Natural" },
      { text: "Resources" },
      { text: "Defense" },
      { text: "NRDC" },
      { text: "USA" },
      { text: "468" }
    ],
    hint: "Heavily abbreviated. 'Natural' -> 'Nat.', 'Resources' -> 'Res.', 'Defense' -> 'Def.'."
  },
  {
    description: "Cite the 1969 Supreme Court case Tinker v. Des Moines Independent Community School District, found in volume 393 of the United States Reports at page 503.",
    correctSegments: [
      { text: "Tinker", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Des", isItalic: true },
      { text: "Moines", isItalic: true },
      { text: "Indep.", isItalic: true },
      { text: "Cmty.", isItalic: true },
      { text: "Sch.", isItalic: true },
      { text: "Dist.", isItalic: true },
      { text: "," },
      { text: "393" },
      { text: "U.S." },
      { text: "503" },
      { text: "(1969)" }
    ],
    distractors: [
      { text: "Independent" },
      { text: "Community" },
      { text: "School" },
      { text: "District" },
      { text: "Ind." },
      { text: "Com." }
    ],
    hint: "Standard abbreviations: 'Indep.', 'Cmty.', 'Sch.', 'Dist.'."
  },
  {
    description: "Cite the 2008 Supreme Court case District of Columbia v. Heller, found in volume 554 of the United States Reports at page 570.",
    correctSegments: [
      { text: "District", isItalic: true },
      { text: "of", isItalic: true },
      { text: "Columbia", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Heller", isItalic: true },
      { text: "," },
      { text: "554" },
      { text: "U.S." },
      { text: "570" },
      { text: "(2008)" }
    ],
    distractors: [
      { text: "D.C." },
      { text: "Dist." },
      { text: "Colum." },
      { text: "555" },
      { text: "US" }
    ],
    hint: "Spell out 'District of Columbia' when it's the full party name."
  },
  {
    description: "Cite the 2015 Supreme Court case Obergefell v. Hodges, found in volume 576 of the United States Reports at page 644.",
    correctSegments: [
      { text: "Obergefell", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Hodges", isItalic: true },
      { text: "," },
      { text: "576" },
      { text: "U.S." },
      { text: "644" },
      { text: "(2015)" }
    ],
    distractors: [
      { text: "575" },
      { text: "US" },
      { text: "Obergefel" },
      { text: "v" }
    ],
    hint: "Volume 576. Standard Supreme Court citation."
  },
  {
    description: "Cite the 1964 Supreme Court case New York Times Co. v. Sullivan, found in volume 376 of the United States Reports at page 254.",
    correctSegments: [
      { text: "N.Y.", isItalic: true },
      { text: "Times", isItalic: true },
      { text: "Co.", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Sullivan", isItalic: true },
      { text: "," },
      { text: "376" },
      { text: "U.S." },
      { text: "254" },
      { text: "(1964)" }
    ],
    distractors: [
      { text: "New" },
      { text: "York" },
      { text: "NY" },
      { text: "375" },
      { text: "US" }
    ],
    hint: "Abbreviate 'New York' to 'N.Y.' in the party name."
  },
  {
    description: "Cite the 1961 Supreme Court case Mapp v. Ohio, found in volume 367 of the United States Reports at page 643.",
    correctSegments: [
      { text: "Mapp", isItalic: true },
      { text: "v.", isItalic: true },
      { text: "Ohio", isItalic: true },
      { text: "," },
      { text: "367" },
      { text: "U.S." },
      { text: "643" },
      { text: "(1961)" }
    ],
    distractors: [
      { text: "368" },
      { text: "US" },
      { text: "Oh." },
      { text: "OH" }
    ],
    hint: "State names are spelled out."
  },
];

// --- Components ---

function App() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [pool, setPool] = useState<Segment[]>([]);
  
  // Replaced fixed slots with dynamic list
  const [draftSegments, setDraftSegments] = useState<Segment[]>([]);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // --- Drag & Drop State ---
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSegment, setDraggedSegment] = useState<Segment | null>(null);
  // Store initial geometry to prevent teleporting glitch
  const [dragStartParams, setDragStartParams] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const dragItemRef = useRef<HTMLDivElement>(null); // The floating visual
  const dragContainerRef = useRef<HTMLDivElement>(null); // The Draft Area
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // Refs for hit testing

  
  const generatePuzzle = () => {
    // Pick random puzzle from DB
    const randomIndex = Math.floor(Math.random() * PUZZLE_DB.length);
    const data = PUZZLE_DB[randomIndex];

    const correctSegments: Segment[] = data.correctSegments.map((s, i) => ({
        id: `correct-${i}-${Date.now()}`,
        text: s.text,
        isItalic: s.isItalic
    }));

    const distractorSegments: Segment[] = data.distractors.map((s, i) => ({
        id: `wrong-${i}-${Date.now()}`,
        text: s.text,
        isItalic: s.isItalic
    }));

    const puzzle: Puzzle = {
        description: data.description,
        correctSegments,
        distractors: distractorSegments,
        hint: data.hint
    };

    setCurrentPuzzle(puzzle);
    
    const allTiles = [...correctSegments, ...distractorSegments].sort(() => Math.random() - 0.5);
    setPool(allTiles);
    setDraftSegments([]); // Reset draft area
    
    setGameState("PLAYING");
    setFeedback(null);
  };

  const handleStartGame = () => {
    setScore(0);
    setLives(3);
    setStreak(0);
    generatePuzzle();
  };

  // --- Interaction Logic ---

  const addToDraft = (segment: Segment) => {
    setDraftSegments(prev => [...prev, segment]);
    setPool(prev => prev.filter(p => p.id !== segment.id));
  };

  // --- Custom Drag Implementation ---

  const handlePointerDown = (e: React.PointerEvent, segment: Segment) => {
    if (gameState !== "PLAYING") return;
    
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Store initial params BEFORE setting dragging state to avoid teleport
    setDragStartParams({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
    });
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    setDraggedSegment(segment);
    setIsDragging(true);

    // Add global listeners
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!dragItemRef.current) return;

    // 1. Move the visual floating element directly (Perf optimization: no React render)
    const currentLeft = parseFloat(dragItemRef.current.style.left || dragStartParams.left.toString());
    const currentTop = parseFloat(dragItemRef.current.style.top || dragStartParams.top.toString());

    // NOTE: This logic needs to be based on the initial render position + delta
    // A simpler way for smooth drag is setting left/top directly to mouse - offset
    dragItemRef.current.style.left = `${e.clientX - dragOffset.x}px`;
    dragItemRef.current.style.top = `${e.clientY - dragOffset.y}px`;
    dragItemRef.current.style.transform = 'none'; // Reset any transforms if we are doing absolute positioning
    
    // 2. Reordering Logic
    setDraftSegments(currentSegments => {
        const draggedId = dragItemRef.current?.dataset.id;
        if (!draggedId) return currentSegments;

        const draggedIndex = currentSegments.findIndex(s => s.id === draggedId);
        if (draggedIndex === -1) return currentSegments;

        let targetIndex = -1;

        // Check intersection with all other items in draft area
        for (let i = 0; i < currentSegments.length; i++) {
            if (i === draggedIndex) continue;
            const targetId = currentSegments[i].id;
            const el = tileRefs.current.get(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Check if cursor is roughly in the middle of the target
                if (e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
                    targetIndex = i;
                    break;
                }
            }
        }

        if (targetIndex !== -1 && targetIndex !== draggedIndex) {
            // Swap
            const newSegments = [...currentSegments];
            const [movedItem] = newSegments.splice(draggedIndex, 1);
            newSegments.splice(targetIndex, 0, movedItem);
            return newSegments;
        }

        return currentSegments;
    });
  };

  const handleGlobalPointerUp = (e: PointerEvent) => {
    setIsDragging(false);
    
    window.removeEventListener("pointermove", handleGlobalPointerMove);
    window.removeEventListener("pointerup", handleGlobalPointerUp);

    // Removal Logic (Drop outside bounds)
    if (dragContainerRef.current && dragItemRef.current) {
        const containerRect = dragContainerRef.current.getBoundingClientRect();
        const buffer = 50; 
        const isOutside = 
            e.clientY < containerRect.top - buffer || 
            e.clientY > containerRect.bottom + buffer ||
            e.clientX < containerRect.left - buffer ||
            e.clientX > containerRect.right + buffer;

        if (isOutside) {
            // CAREFUL: We need the ID from the ref because closure state might be stale
            const droppedId = dragItemRef.current.dataset.id;
            if (droppedId) {
                // Remove from draft
                setDraftSegments(prev => {
                     const seg = prev.find(s => s.id === droppedId);
                     if (seg) {
                         // Add to pool - MUST be done outside this pure function to avoid side effects
                         // But we are in an event handler, so we can chain state updates safely here IF we don't depend on the previous line's output immediately
                         // Actually, we can just filter here.
                         return prev.filter(s => s.id !== droppedId);
                     }
                     return prev;
                });
                
                // Add to pool independently
                // We need to find the segment object. Since we might have filtered it out above, 
                // we should find it from the *current* state before filtering, or just use the draggedSegment state variable if it's reliable.
                // However, handleGlobalPointerUp closes over the initial render scope unless we use a ref for state.
                // Better approach: use the functional update of setDraftSegments to find it, 
                // BUT we can't update setPool inside it.
                // Solution: We have `draggedSegment` in component state!
                // But `handleGlobalPointerUp` is defined in render, so it closes over the `draggedSegment` at the time of bind? 
                // No, we add the listener in `handlePointerDown` which forms a closure. 
                // If `draggedSegment` changes, the closure is stale.
                // BUT `handlePointerDown` sets `draggedSegment` right before adding listeners. 
                // The `draggedSegment` variable INSIDE `handlePointerDown` (passed as arg) is stable!
                
                // We don't have access to the segment arg here.
                // We can trust `dragItemRef.current.dataset.id`.
                // We need to find the segment data. We can find it in `draftSegments` state via functional update? No.
                // Let's use a ref to store the currently dragged segment data to ensure availability in the callback.
            }
        }
    }
    
    setDraggedSegment(null);
  };
  
  // Ref to track the actual object being dragged to avoid stale closures in event handlers
  const activeDragSegmentRef = useRef<Segment | null>(null);
  
  // Wrap the start handler to set the ref
  const onDragStart = (e: React.PointerEvent, segment: Segment) => {
      activeDragSegmentRef.current = segment;
      handlePointerDown(e, segment);
  }

  // Rewrite the cleanup part of handleGlobalPointerUp to use the ref
  const handleDragEndLogic = (e: PointerEvent) => {
      if (dragContainerRef.current && activeDragSegmentRef.current) {
        const containerRect = dragContainerRef.current.getBoundingClientRect();
        const buffer = 50; 
        const isOutside = 
            e.clientY < containerRect.top - buffer || 
            e.clientY > containerRect.bottom + buffer ||
            e.clientX < containerRect.left - buffer ||
            e.clientX > containerRect.right + buffer;

        if (isOutside) {
             const seg = activeDragSegmentRef.current;
             setDraftSegments(prev => prev.filter(s => s.id !== seg.id));
             setPool(prev => [...prev, seg]);
        }
      }
      activeDragSegmentRef.current = null;
  }
  
  // Hijack the listener removal to inject our logic
  useEffect(() => {
      // We don't need an effect, just call it inside handleGlobalPointerUp before clearing state
  }, []);

  // Update handleGlobalPointerUp to call the logic
  const originalHandleGlobalPointerUp = handleGlobalPointerUp; // (reference to previous implementation concept)
  
  // We need to patch the listener to use the new logic
  // Let's redefine handleGlobalPointerUp to be safe
  const handlePointerUpSafe = (e: PointerEvent) => {
      handleDragEndLogic(e);
      setIsDragging(false);
      setDraggedSegment(null);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handlePointerUpSafe);
  };

  // Modify handlePointerDown to use the safe up handler
  const handlePointerDownSafe = (e: React.PointerEvent, segment: Segment) => {
      if (gameState !== "PLAYING") return;
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      setDragStartParams({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
      });
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      setDraggedSegment(segment);
      activeDragSegmentRef.current = segment;
      setIsDragging(true);

      window.addEventListener("pointermove", handleGlobalPointerMove);
      window.addEventListener("pointerup", handlePointerUpSafe);
  };


  const checkAnswer = () => {
    if (!currentPuzzle) return;
    
    const playerSegments = draftSegments;
    
    // Validation
    let isCorrect = true;
    
    if (playerSegments.length !== currentPuzzle.correctSegments.length) {
      isCorrect = false;
    } else {
      for (let i = 0; i < currentPuzzle.correctSegments.length; i++) {
        if (playerSegments[i].text !== currentPuzzle.correctSegments[i].text || 
            playerSegments[i].isItalic !== currentPuzzle.correctSegments[i].isItalic) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      setGameState("SUCCESS");
      setScore(s => s + 100 + (streak * 10));
      setStreak(s => s + 1);
      setFeedback("SUSTAINED! Perfect citation.");
    } else {
      setLives(l => l - 1);
      setStreak(0);
      setFeedback("OBJECTION! Incorrect formatting or order.");
      
      if (lives - 1 <= 0) {
        setGameState("GAMEOVER");
      } else {
        setGameState("FAILURE");
        setTimeout(() => {
          setGameState("PLAYING");
          setFeedback(null);
        }, 1500);
      }
    }
  };

  const handleShowAnswer = () => {
    if (!currentPuzzle) return;

    setDraftSegments(currentPuzzle.correctSegments.map((s, i) => ({
        ...s,
        id: `revealed-${i}-${Date.now()}` 
    })));
    
    setLives(l => l - 1);
    setStreak(0);
    setFeedback("Review the solution below.");
    setGameState("ROUND_OVER_LOSS");
  };

  const handleNextLevel = () => {
    if (lives <= 0) {
        setGameState("GAMEOVER");
    } else {
        generatePuzzle();
    }
  };

  // --- Render Helpers ---

  // Helper to sync refs
  const setTileRef = (id: string, el: HTMLDivElement | null) => {
      if (el) {
          tileRefs.current.set(id, el);
      } else {
          tileRefs.current.delete(id);
      }
  };

  // --- Screens ---

  if (gameState === "MENU") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 text-9xl font-serif">§</div>
             <div className="absolute bottom-20 right-20 text-9xl font-serif">¶</div>
             <div className="absolute top-1/2 left-1/4 text-8xl font-serif italic">v.</div>
        </div>

        <div className="max-w-md w-full text-center space-y-8 z-10 animate-pop-in">
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-blue-400 font-serif drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">BLUEBOOK<br/>BLITZ</h1>
            <p className="text-slate-400 text-lg font-mono">The Partner is waiting.</p>
          </div>
          
          <div className="p-8 bg-slate-800 rounded-xl border-t border-slate-700 shadow-2xl">
            <h3 className="font-bold text-xl mb-6 text-blue-200 border-b border-slate-700 pb-2">PARALEGAL ORIENTATION</h3>
            <ul className="text-left space-y-4 text-slate-300 mb-8 font-sans">
              <li className="flex items-center"><span className="w-8 text-2xl">⚖️</span> <span>Build citations from atoms.</span></li>
              <li className="flex items-center"><span className="w-8 text-2xl">🖱️</span> <span>Drag to reorder tiles.</span></li>
              <li className="flex items-center"><span className="w-8 text-2xl">⏱️</span> <span>Speed builds your streak.</span></li>
              <li className="flex items-center"><span className="w-8 text-2xl">💔</span> <span>3 Strikes and you're fired.</span></li>
            </ul>
            <button 
              onClick={handleStartGame}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all text-xl uppercase tracking-widest"
            >
              Start Shift
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "GAMEOVER") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-950 text-white animate-pop-in">
        <h1 className="text-6xl font-black mb-4 font-serif text-red-200">FIRED</h1>
        <p className="text-xl mb-8 font-mono text-red-100/80">"This brief is unreadable."</p>
        <div className="bg-red-900/50 p-8 rounded-lg border-2 border-red-800 text-center mb-8">
            <div className="text-sm uppercase tracking-widest text-red-300 mb-2">Final Score</div>
            <div className="text-6xl font-mono font-bold">{score}</div>
        </div>
        <button 
          onClick={handleStartGame}
          className="px-8 py-3 bg-white text-red-900 font-bold rounded shadow-lg hover:bg-gray-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200 font-sans select-none">
      {/* HUD */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Billable Hours (Score)</span>
            <span className="font-mono text-2xl font-bold text-blue-400">{score}</span>
        </div>
        <div className="flex gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`text-xl transition-all duration-300 ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-75 grayscale'}`}>
              ❤️
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col">
        {gameState === "LOADING" ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
             <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="text-blue-200 text-xl font-mono tracking-widest">Opening Case File...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-6">
            
            {/* Case Brief Card */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-800/80 p-6 rounded-xl border-l-4 border-blue-500 shadow-xl">
               <div className="flex items-center gap-2 mb-3">
                 <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Assignment</span>
               </div>
               <p className="text-xl md:text-2xl font-serif leading-relaxed text-slate-100">
                 {currentPuzzle?.description}
               </p>
               {currentPuzzle?.hint && (
                 <p className="mt-2 text-sm text-slate-500 italic">Hint: {currentPuzzle.hint}</p>
               )}
            </div>

            {/* Workspace (Drop Zone) */}
            <div 
                ref={dragContainerRef}
                className="flex-1 bg-slate-800 rounded-xl shadow-inner flex flex-col relative overflow-hidden transition-colors duration-300 border border-slate-700"
            >
               {/* Notebook lines background */}
               <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px)', backgroundSize: '100% 2rem' }}></div>

               {/* Banner for revealed answer */}
               {gameState === "ROUND_OVER_LOSS" && (
                   <div className="w-full bg-red-900/40 border-b border-red-500/30 p-3 text-center z-20 animate-pop-in">
                       <p className="text-red-200 font-bold tracking-wide">⚠️ {feedback}</p>
                   </div>
               )}

               <div className="p-6 md:p-8 flex flex-col flex-1 z-10">
                   <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6 text-center">
                       {gameState === "ROUND_OVER_LOSS" ? "Correct Citation Revealed:" : "Draft Citation Below (Drag to Reorder)"}
                   </h3>
                   
                   <div className="flex flex-wrap items-end justify-start gap-x-1.5 gap-y-2 min-h-[100px] content-start">
                     
                     {/* Render Filled Segments */}
                     {draftSegments.map((segment, idx) => {
                         const isBeingDragged = draggedSegment?.id === segment.id;
                         return (
                            <div 
                                key={segment.id} 
                                ref={(el) => setTileRef(segment.id, el)}
                                onPointerDown={(e) => handlePointerDownSafe(e, segment)}
                                className={`relative group touch-none ${isBeingDragged ? 'opacity-0' : 'opacity-100'}`}
                            >
                                <button
                                    className={`
                                    flex flex-col items-center justify-center min-w-[30px]
                                    px-3 py-1.5 rounded shadow-[0_2px_0px_0px_rgba(0,0,0,0.2)] font-serif text-sm md:text-base border-b-2 transition-all duration-200 cursor-grab active:cursor-grabbing
                                    ${segment.isItalic ? 'italic font-medium' : 'font-normal'}
                                    bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-50 hover:-translate-y-0.5
                                    `}
                                >
                                    <span>{segment.text}</span>
                                    {segment.isItalic && <span className="text-[9px] not-italic leading-none text-indigo-400 font-sans uppercase tracking-tighter mt-0.5">Italic</span>}
                                </button>
                            </div>
                         );
                     })}

                     {/* Visual "Empty Slots" to indicate target length */}
                     {currentPuzzle && Array.from({ length: Math.max(0, currentPuzzle.correctSegments.length - draftSegments.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-10 h-8 border-b-2 border-slate-600/50 flex items-center justify-center transition-colors">
                            <span className="text-slate-700 text-xs opacity-0">_</span>
                        </div>
                     ))}
                   </div>
               </div>

                {/* Feedback Overlay */}
                {(gameState === "SUCCESS" || gameState === "FAILURE") && (
                  <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-30 animate-pop-in ${gameState === 'SUCCESS' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                    <div className={`px-8 py-6 rounded-xl font-bold text-3xl shadow-2xl border-4 transform rotate-[-2deg] text-center ${gameState === 'SUCCESS' ? 'bg-green-100 text-green-900 border-green-600' : 'bg-red-100 text-red-900 border-red-600'}`}>
                      {feedback}
                    </div>
                  </div>
                )}
            </div>

            {/* Tile Pool */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 z-10">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Research Notes (Click to Add)</h3>
              <div className="flex flex-wrap gap-2 justify-center min-h-[80px]">
                {pool.map((segment) => (
                     <button
                        key={segment.id}
                        onClick={() => addToDraft(segment)}
                        className={`
                        flex flex-col items-center justify-center min-w-[30px]
                        px-3 py-1.5 rounded shadow-[0_2px_0px_0px_rgba(0,0,0,0.2)] font-serif text-sm md:text-base border-b-2 transition-all duration-200
                        ${segment.isItalic ? 'italic font-medium' : 'font-normal'}
                        bg-amber-100 text-slate-900 border-amber-300 hover:bg-white hover:-translate-y-1
                        `}
                    >
                        <span>{segment.text}</span>
                        {segment.isItalic && <span className="text-[9px] not-italic leading-none text-slate-400 font-sans uppercase tracking-tighter mt-0.5">Italic</span>}
                    </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end pt-2 gap-4">
              {gameState === "PLAYING" && (
                 <button 
                  onClick={handleShowAnswer}
                  className="px-4 py-4 text-slate-400 hover:text-white hover:bg-slate-800 font-mono text-sm rounded transition-colors uppercase tracking-wider"
                 >
                   Show Answer (-1 ❤️)
                 </button>
              )}

              {gameState === "SUCCESS" || gameState === "ROUND_OVER_LOSS" ? (
                <button
                  onClick={handleNextLevel}
                  className={`px-8 py-4 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2 uppercase tracking-wider ${lives <= 0 ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                >
                  {lives <= 0 ? "Pack Your Things ➔" : "NEXT CASE ➔"}
                </button>
              ) : (
                <button
                  onClick={checkAnswer}
                  disabled={gameState !== "PLAYING" || draftSegments.length === 0}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border disabled:border-slate-700 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider"
                >
                  Submit Brief
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DRAG OVERLAY PORTAL */}
      {isDragging && draggedSegment && (
          <div 
            ref={dragItemRef}
            data-id={draggedSegment.id}
            className="fixed z-50 pointer-events-none shadow-2xl opacity-90 scale-110"
            style={{
                left: `${dragStartParams.left}px`,
                top: `${dragStartParams.top}px`,
                width: `${dragStartParams.width}px`,
                height: `${dragStartParams.height}px`,
                touchAction: 'none'
            }}
          >
             <button
                className={`
                w-full h-full flex flex-col items-center justify-center
                px-2 py-1.5 rounded font-serif text-sm md:text-base border-b-2
                ${draggedSegment.isItalic ? 'italic font-medium' : 'font-normal'}
                bg-indigo-100 text-indigo-900 border-indigo-400
                `}
            >
                <span>{draggedSegment.text}</span>
                {draggedSegment.isItalic && <span className="text-[9px] not-italic leading-none text-indigo-400 font-sans uppercase tracking-tighter mt-0.5">Italic</span>}
            </button>
          </div>
      )}

    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);