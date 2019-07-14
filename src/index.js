import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

// Slomux — упрощённая, сломанная реализация Flux.
// Перед вами небольшое приложение, написанное на React + Slomux.
// Это нерабочий секундомер с настройкой интервала обновления.

// Исправьте ошибки и потенциально проблемный код, почините приложение и прокомментируйте своё решение.

// При нажатии на "старт" должен запускаться секундомер и через заданный интервал времени увеличивать свое значение на значение интервала
// При нажатии на "стоп" секундомер должен останавливаться и сбрасывать свое значение

const createStore = (reducer, initialState) => {
    let currentState = initialState;
    const listeners = [];

    const getState = () => currentState;
    const dispatch = action => {
        currentState = reducer(currentState, action);
        listeners.forEach(listener => listener());
    }

    const subscribe = listener => listeners.push(listener);

    return { getState, dispatch, subscribe };
}

const connect = (mapStateToProps, mapDispatchToProps) =>
    Component => {
        class WrappedComponent extends React.Component {
            render() {
                return (
                    <Component
                        {...this.props}
                        {...mapStateToProps(this.context.store.getState(), this.props)}
                        {...mapDispatchToProps(this.context.store.dispatch, this.props)}
                    />
                )
            }

            // для того, чтобы подписаться на обновления нужно использовать функцию 
            // componentDidMount() вместо componentDidUpdate()
            componentDidMount() {
                this.context.store.subscribe(this.handleChange);
            }

            handleChange = () => {
                this.forceUpdate();
            }
        }

        WrappedComponent.contextTypes = {
            store: PropTypes.object,
        }

        return WrappedComponent;
    }

class Provider extends React.Component {
    getChildContext() {
        return {
            store: this.props.store,
        }
    }

    render() {
        return React.Children.only(this.props.children);
    }
}

Provider.childContextTypes = {
    store: PropTypes.object,
}

// APP

// actions
// добавил еще один action CHANGE_CURRENT_TIME 
// для обновления текущего значения таймера
// и action creator для него
const CHANGE_INTERVAL = 'CHANGE_INTERVAL';
const CHANGE_CURRENT_TIME = 'CHANGE_CURRENT_TIME';

// action creators
const changeInterval = value => ({
    type: CHANGE_INTERVAL,
    payload: value,
})

const changeCurrentTime = value => ({
    type: CHANGE_CURRENT_TIME,
    payload: value,
})


// reducers
const reducer = (state, action) => {
    // добавил case для CHANGE_CURRENT_TIME
    // и в конце каждого case'a break
    // state содержит теперь 2 поля:
    // {
    //      currentInterval:1,
    //      currentTime:0
    // }
    // поэтому для обновления каждого из них будет вызываться своя функция.
    // 
    // при изменении значений полей state будет возвращен новый объект newState
    let newState = { ...state };
    //let newState = state;

    switch (action.type) {

        case CHANGE_INTERVAL:
            if (action.payload > 0)
                newState.currentInterval = action.payload;
            break;

        case CHANGE_CURRENT_TIME:
            newState.currentTime = action.payload;
            break;

        default:
            // редюсер всегда должен возвращать state
            return state;

    }

    return newState;

}

// components

class IntervalComponent extends React.Component {
    render() {
        return (
            <div>
                <span>Интервал обновления секундомера: {this.props.currentInterval} сек.</span>
                <span>
                    <button onClick={() => this.props.changeInterval(this.props.currentInterval - 1)}>-</button>
                    <button onClick={() => this.props.changeInterval(this.props.currentInterval + 1)}>+</button>
                </span>
            </div>
        )
    }
}

// перепутаны местами mapStateToProps и mapDispatchToProps
const Interval = connect(
    state => ({
        currentInterval: state.currentInterval
    }),
    dispatch => ({
        changeInterval: value => dispatch(changeInterval(value)),
    }))(IntervalComponent)

class TimerComponent extends React.Component {
    // state напрямую не используется
    // вместо этого добавлена переменная timer 
    // для остановки таймера через clearTimeout
    timer = null;
    // переменная interval будет хранить значение this.props.currentInterval
    // чтобы при изменении интервала без остановки таймера секундомер 
    // считал корректно
    interval = 0;

    render() {
        // в onClick передаем this.handleStart.bind(this)
        // для того, чтобы иметь доступ к this внутри функции handleStart.
        // тоже самое для handleStop
        return (
            <div>
                <Interval />
                <div>
                    Секундомер: {this.props.currentTime} сек.
          </div>
                <div>
                    <button onClick={this.handleStart.bind(this)}>Старт</button>
                    <button onClick={this.handleStop.bind(this)}>Стоп</button>
                </div>
            </div>
        )
    }

    handleStart() {
        // вызываем сначала this.handleStop()
        // чтобы остановить таймер если он уже был запущен
        // и запускаем таймер только если this.props.currentInterval больше 0.

        // вместь setState исползуем нашу dispatch функцию changeCurrentTime
        // которая обновить наш currentTime

        // вторым аргументом нужно передать не просто this.props.currentInterval,
        // а this.props.currentInterval * 1000 т.к. в setTimeout указываются миллисекунды
        this.handleStop();

        this.interval = this.props.currentInterval;

        if (this.interval > 0) {

            this.timer = setInterval(
                () => this.props.changeCurrentTime(this.props.currentTime + this.interval),
                this.interval * 1000);

        }

    }

    handleStop() {
        // проверяем если таймер запущен сначала останавливаем его
        // функцией clearTimeout
        if (this.timer) {

            clearTimeout(this.timer);

        }
        // затем вместо setState вызываем функцию changeCurrentTime
        // для установки currentTime в 0
        this.props.changeCurrentTime(0);

    }
}

const Timer = connect(state => ({
    currentTime: state.currentTime,
    currentInterval: state.currentInterval
}), dispatch => ({
    changeCurrentTime: value => dispatch(changeCurrentTime(value)),
}))(TimerComponent)

// init
// createStore вторым аргументом принимает начальное состояние state
ReactDOM.render(
    <Provider store={createStore(reducer, { currentTime: 0, currentInterval: 1 })}>
        <Timer />
    </Provider>,
    document.getElementById('app')
)