"""tools/scene_place.py: where a GameObject of a scene is in the world, for the extractors
(tools/extract-pickups.py, extract-people.py, extract-wishes.py). Each Transform's scale, turn about
z and place, from the object's own up to the scene's root, as Unity composes them.

The turn counts (16-Oct-2026): most scenes keep their Act 3 variants under a "Black Thread States
Thread Only Variant" turned by 14 to 62 degrees, its children turned back. Composed without the
turn, what lies under it landed under the floor or above the room (Shakra on guard in Greymoor_08,
Garmond in Greymoor_07, Sherma at the Pilgrim's Rest, Bellhart's pilgrims, Ant_04's shard caches). """
import math


def placer(T, of_go):
    """A GameObject's own points → the world (gid → a function of x, y). T: Transform path id →
    Transform; of_go: GameObject path id → its Transform."""
    def of(gid):
        chain, t = [], of_go.get(gid)
        while t is not None and len(chain) < 64:
            chain.append(t)
            f = t.m_Father.m_PathID
            t = T.get(f) if f else None

        def at(x, y):
            for t in chain:
                s, r, p = t.m_LocalScale, t.m_LocalRotation, t.m_LocalPosition
                a = 2 * math.atan2(r.z, r.w)
                x, y = x * s.x, y * s.y
                x, y = x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)
                x, y = x + p.x, y + p.y
            return x, y
        at.found = bool(chain)
        return at
    return of


def world_of(T, of_go, digits=None):
    """gid → [x, y], the object's place in the world ([] for one with no Transform)."""
    of = placer(T, of_go)

    def world(gid):
        at = of(gid)
        if not at.found:
            return []
        x, y = at(0.0, 0.0)
        return [round(x, digits), round(y, digits)] if digits is not None else [x, y]
    return world
