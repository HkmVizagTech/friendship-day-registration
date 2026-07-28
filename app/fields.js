'use client';

const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Postgraduate'];

export default function PersonFields({ idPrefix, keyPrefix, values, errors, onSet, onPick }) {
  const e = (k) => errors[`${keyPrefix}${k}`];
  const id = (k) => `${idPrefix}-${k}`;
  const isStudent = values.occupation === 'student';
  const isWorking = values.occupation === 'working';

  return (
    <div className="who-block">
      <div className="field">
        <label htmlFor={id('name')}>Full name</label>
        <input
          id={id('name')}
          value={values.name}
          onChange={onSet('name')}
          className={e('name') ? 'bad' : ''}
          autoComplete="name"
          placeholder="Name for the entry pass"
        />
        {e('name') && <p className="err">{e('name')}</p>}
      </div>

      <div className="field half-row">
        <div>
          <label htmlFor={id('phone')}>Mobile</label>
          <input
            id={id('phone')}
            value={values.phone}
            onChange={onSet('phone')}
            className={e('phone') ? 'bad' : ''}
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            placeholder="10 digits"
          />
          {e('phone') && <p className="err">{e('phone')}</p>}
        </div>
        <div>
          <label htmlFor={id('age')}>Age</label>
          <input
            id={id('age')}
            value={values.age}
            onChange={onSet('age')}
            className={e('age') ? 'bad' : ''}
            inputMode="numeric"
            maxLength={2}
            placeholder="Up to 30"
          />
          {e('age') && <p className="err">{e('age')}</p>}
        </div>
      </div>

      <div className="field">
        <label>Currently</label>
        <div className="seg">
          <button type="button" aria-pressed={isStudent} onClick={onPick('student')}>
            Studying
          </button>
          <button type="button" aria-pressed={isWorking} onClick={onPick('working')}>
            Working
          </button>
        </div>
        {e('occupation') && <p className="err">{e('occupation')}</p>}
      </div>

      {isWorking && (
        <div className="field reveal">
          <label htmlFor={id('company')}>Company</label>
          <input
            id={id('company')}
            value={values.company}
            onChange={onSet('company')}
            className={e('company') ? 'bad' : ''}
            autoComplete="organization"
            placeholder="Where you work"
          />
          {e('company') && <p className="err">{e('company')}</p>}
        </div>
      )}

      {isStudent && (
        <>
          <div className="field reveal">
            <label htmlFor={id('college')}>College</label>
            <input
              id={id('college')}
              value={values.college}
              onChange={onSet('college')}
              className={e('college') ? 'bad' : ''}
              placeholder="Where you study"
            />
            {e('college') && <p className="err">{e('college')}</p>}
          </div>
          <div className="field reveal">
            <label htmlFor={id('year')}>Year of study</label>
            <select
              id={id('year')}
              value={values.year}
              onChange={onSet('year')}
              className={e('year') ? 'bad' : ''}
            >
              <option value="">Choose a year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {e('year') && <p className="err">{e('year')}</p>}
          </div>
        </>
      )}
    </div>
  );
}
