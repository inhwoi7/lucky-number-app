"use client";

import { useState, useCallback, useRef } from "react";
import { useDrum } from "@/lib/useDrum";
import { analyzeFixed, ballColor, drawNumbers, Hexagram } from "@/lib/luckyEngine";
import styles from "./DrumMachine.module.css";

const RADIUS = 118;
const TOTAL = 45;

function getBallPos(n: number, angle: number) {
  const base = ((n - 1) / TOTAL) * 2 * Math.PI - Math.PI / 2;
  const a = base + angle;
  return {
    x: 150 + RADIUS * Math.cos(a) - 16,
    y: 150 + RADIUS * Math.sin(a) - 16,
  };
}

interface ResultBall {
  num: number;
  isFixed: boolean;
  visible: boolean;
}

export default function DrumMachine() {
  const [fixed, setFixed] = useState<Set<number>>(new Set());
  const [resultBalls, setResultBalls] = useState<ResultBall[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [centerMsg, setCenterMsg] = useState("구슬을 눌러\n고정 번호 선택");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [hoveredBall, setHoveredBall] = useState<number | null>(null);
  const { drumAngle, spinAndStop, startIdle } = useDrum();

  const toggleFixed = useCallback(
    (n: number) => {
      if (isDrawing) return;
      setFixed((prev) => {
        const next = new Set(prev);
        if (next.has(n)) {
          next.delete(n);
        } else {
          if (next.size >= 5) return prev;
          next.add(n);
        }
        return next;
      });
    },
    [isDrawing]
  );

  const revealNumbers = useCallback(
    (drawn: number[], hexa: Hexagram, fixedSnap: Set<number>) => {
      const sorted = [...drawn].sort((a, b) => a - b);
      const fixedArr = [...fixedSnap].sort((a, b) => a - b);
      const randoms = drawn.filter((n) => !fixedSnap.has(n));
      const revealOrder = [...fixedArr, ...randoms];

      const initial: ResultBall[] = sorted.map((n) => ({
        num: n,
        isFixed: fixedSnap.has(n),
        visible: false,
      }));
      setResultBalls(initial);
      setHexagram(hexa);

      let delay = 0;
      revealOrder.forEach((n) => {
        const isFixed = fixedSnap.has(n);
        setTimeout(() => {
          setResultBalls((prev) =>
            prev.map((b) => (b.num === n ? { ...b, visible: true } : b))
          );
          if (navigator.vibrate) navigator.vibrate(isFixed ? [40, 0, 40] : [20]);
        }, delay);
        delay += isFixed ? 500 : 380;
      });

      setTimeout(() => {
        setIsDrawing(false);
        setIsDone(true);
        startIdle();
        setCenterMsg("번호가\n뽑혔습니다!");
      }, delay + 400);
    },
    [startIdle]
  );

  const handleDraw = useCallback(() => {
    if (isDrawing) return;
    setIsDrawing(true);
    setIsDone(false);
    setResultBalls([]);
    setHexagram(null);
    const fixedSnap = new Set(fixed);
    setCenterMsg("주역 기운\n불러오는 중...");
    spinAndStop(() => {
      const { result, hexagram: hexa } = drawNumbers(fixedSnap);
      revealNumbers(result, hexa, fixedSnap);
    });
  }, [isDrawing, fixed, spinAndStop, revealNumbers]);

  const handleReset = useCallback(() => {
    setFixed(new Set());
    setResultBalls([]);
    setHexagram(null);
    setIsDone(false);
    setIsDrawing(false);
    setCenterMsg("구슬을 눌러\n고정 번호 선택");
    startIdle();
  }, [startIdle]);

  const copyNums = useCallback(() => {
    const txt = resultBalls.map((b) => b.num).join(", ");
    navigator.clipboard.writeText(txt);
  }, [resultBalls]);

  const advisory = analyzeFixed([...fixed]);

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.sun}>☀</div>
        <p className={styles.eyebrow}>Wise Rest with Sunny · 다상담</p>
        <h1 className={styles.title}>행운의 숫자</h1>
        <p className={styles.sub}>드럼에서 나의 번호가 뽑힙니다</p>
      </header>

      {/* DRUM */}
      <section className={styles.stage}>
        <span className={styles.chip}>구슬을 눌러 고정하세요 (최대 5개)</span>

        <div className={styles.drumWrap}>
          <div className={styles.drumRing}>
            <div className={styles.drumInner} />
            <div className={styles.chute} />
          </div>

          {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
            const { x, y } = getBallPos(n, drumAngle);
            const isFixed = fixed.has(n);
            const isHovered = hoveredBall === n;

            return (
              <button
                key={n}
                onClick={() => toggleFixed(n)}
                onMouseEnter={() => setHoveredBall(n)}
                onMouseLeave={() => setHoveredBall(null)}
                onTouchStart={() => setHoveredBall(n)}
                onTouchEnd={() => setHoveredBall(null)}
                className={[
                  styles.drumBall,
                  styles[ballColor(n)],
                  isFixed ? styles.fixedSel : "",
                  isHovered ? styles.magnified : "",
                ].join(" ")}
                style={{
                  left: x,
                  top: y,
                  zIndex: isHovered ? 100 : isFixed ? 10 : 1,
                }}
                aria-label={`숫자 ${n}${isFixed ? " (고정됨)" : ""}`}
              >
                <span className={styles.ballNum}>{n}</span>
                {isFixed && <span className={styles.lockPip}>🔒</span>}
              </button>
            );
          })}

          {/* Magnifier bubble */}
          {hoveredBall !== null && (() => {
            const { x, y } = getBallPos(hoveredBall, drumAngle);
            const cx = x + 16, cy = y + 16;
            const dx = 150 - cx, dy = 150 - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const tipX = cx + (dx / dist) * 72;
            const tipY = cy + (dy / dist) * 72;
            return (
              <div
                className={styles.magnifierBubble}
                style={{ left: tipX - 26, top: tipY - 26, pointerEvents: "none" }}
              >
                {hoveredBall}
              </div>
            );
          })()}

          {/* Center info */}
          <div className={styles.center}>
            <span className={styles.centerSym}>{hexagram?.sym ?? "☰"}</span>
            <span className={styles.centerMsg}>{centerMsg}</span>
            {fixed.size > 0 && (
              <span className={styles.centerCount}>
                {fixed.size} fixed · {6 - fixed.size} random
              </span>
            )}
          </div>
        </div>

        <p className={styles.tally}>
          고정 숫자 <strong>{fixed.size}</strong> / 5개
        </p>
        <p className={styles.advisory}>{advisory}</p>
      </section>

      {/* RESULT */}
      <section className={styles.resultSection}>
        <span className={styles.chip}>추출 결과</span>
        <h2 className={styles.resultTitle}>오늘의 행운 번호</h2>
        <div className={styles.resultRow}>
          {resultBalls.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.emptySlot}>·</div>
              ))
            : resultBalls.map((b) => (
                <div
                  key={b.num}
                  className={[
                    styles.resBall,
                    styles[ballColor(b.num)],
                    b.visible ? styles.pop : styles.hidden,
                    b.isFixed ? styles.fixedSel : "",
                  ].join(" ")}
                >
                  <span className={styles.ballNum}>{b.num}</span>
                  {b.isFixed && <span className={styles.lockPip}>🔒</span>}
                </div>
              ))}
        </div>

        {hexagram && isDone && (
          <div className={styles.philCard}>
            <span className={styles.hexaBadge}>
              {hexagram.sym} {hexagram.name}
            </span>
            <p className={styles.philQ}>"{hexagram.quote}"</p>
            <p className={styles.philS}>{hexagram.src}</p>
          </div>
        )}
      </section>

      {/* BUTTONS */}
      <button className={styles.btnMain} onClick={handleDraw} disabled={isDrawing}>
        {isDone ? "✦ 다시 추출하기" : "✦ 나의 번호 추출하기"}
      </button>

      {isDone && (
        <>
          <button className={styles.btnSub} onClick={handleReset}>
            처음으로 돌아가기
          </button>
          <div className={styles.actions}>
            <button className={styles.btnAct} onClick={copyNums}>📋 복사</button>
            <button
              className={styles.btnAct}
              onClick={() =>
                navigator.share?.({
                  title: "행운의 숫자",
                  text: `[다상담] ${resultBalls.map((b) => b.num).join(", ")}`,
                })
              }
            >
              📤 공유
            </button>
          </div>
        </>
      )}
    </div>
  );
}
